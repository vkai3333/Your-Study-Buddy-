import AppKit
import PDFKit
import UniformTypeIdentifiers
import UserNotifications
import WebKit

private struct PackageImportFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

private final class StudyWebView: WKWebView {
    override func mouseDown(with event: NSEvent) {
        let point = convert(event.locationInWindow, from: nil)
        // Only the narrow header at the top moves the window. Keeping the rest
        // of the interface outside this strip prevents accidental dragging and
        // allows normal text selection everywhere else.
        if point.y >= bounds.height - 50 {
            window?.performDrag(with: event)
            return
        }
        super.mouseDown(with: event)
    }

    override func performKeyEquivalent(with event: NSEvent) -> Bool {
        let modifiers = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
        let key = event.charactersIgnoringModifiers?.lowercased()
        if modifiers.contains(.control) {
            if key == "c" {
                return NSApp.sendAction(#selector(NSText.copy(_:)), to: nil, from: self)
            }
            if key == "v" {
                return NSApp.sendAction(#selector(NSText.paste(_:)), to: nil, from: self)
            }
        }
        return super.performKeyEquivalent(with: event)
    }
}

private final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        installMainMenu()
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(self, name: "studyAlarm")
        configuration.userContentController.add(self, name: "studyExport")
        configuration.userContentController.add(self, name: "noteExport")
        configuration.userContentController.add(self, name: "studyDroppedFile")
        configuration.userContentController.add(self, name: "notebookImportFile")
        configuration.userContentController.add(self, name: "studyFullscreen")

        let webView = StudyWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1360, height: 900),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Your Study Buddy"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.collectionBehavior.insert(.fullScreenPrimary)
        window.minSize = NSSize(width: 920, height: 650)
        window.center()
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)
        self.window = window

        guard let webDirectory = Bundle.main.resourceURL?.appendingPathComponent("Web") else {
            presentLaunchError("The Your Study Buddy interface is missing from the app bundle.")
            return
        }
        webView.loadFileURL(webDirectory.appendingPathComponent("index.html"), allowingReadAccessTo: webDirectory)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let payload = message.body as? [String: Any] else { return }
        if message.name == "studyExport" {
            exportStudySet(payload)
            return
        }
        if message.name == "noteExport" {
            exportNote(payload)
            return
        }
        if message.name == "studyDroppedFile" {
            importDroppedStudyFile(payload, in: message.webView)
            return
        }
        if message.name == "notebookImportFile" {
            chooseNotebookImportFile(in: message.webView)
            return
        }
        if message.name == "studyFullscreen" {
            let active = (payload["active"] as? Bool) ?? (payload["active"] as? NSNumber)?.boolValue ?? false
            setWindowFullscreen(active)
            return
        }
        guard message.name == "studyAlarm", let action = payload["action"] as? String, let identifier = payload["id"] as? String else { return }
        if action == "cancel" {
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
            return
        }
        guard action == "schedule", let title = payload["title"] as? String, let timestamp = payload["timestamp"] as? Double else { return }
        let description = (payload["description"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let date = Date(timeIntervalSince1970: timestamp / 1000)
        guard date > Date() else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = description?.isEmpty == false ? description! : "It’s time to study."
        content.sound = .default
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false))
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            guard granted, error == nil else { return }
            UNUserNotificationCenter.current().add(request)
        }
    }

    private func importDroppedStudyFile(_ payload: [String: Any], in webView: WKWebView?) {
        guard let webView, let name = payload["name"] as? String, let encoded = payload["data"] as? String,
              let comma = encoded.firstIndex(of: ","), let data = Data(base64Encoded: String(encoded[encoded.index(after: comma)...])) else {
            if let webView { callJavaScript("receiveDocumentImportError", payload: "The dropped file could not be read.", in: webView) }
            return
        }
        let fileExtension = URL(fileURLWithPath: name).pathExtension.lowercased()
        let importingNotebookNote = (payload["target"] as? String) == "notes"
        let documentResultHandler = importingNotebookNote ? "receiveNotebookDocumentImport" : "receiveDocumentImport"
        let documentStatusHandler = importingNotebookNote ? "receiveNotebookDocumentImportStatus" : "receiveDocumentImportStatus"
        let documentErrorHandler = importingNotebookNote ? "receiveNotebookDocumentImportError" : "receiveDocumentImportError"
        guard ["apkg", "pdf", "pptx"].contains(fileExtension) else { callJavaScript(documentErrorHandler, payload: "Drop an APKG, PDF, or PPTX file.", in: webView); return }
        callJavaScript(documentStatusHandler, payload: "Reading \(name)…", in: webView)
        DispatchQueue.global(qos: .userInitiated).async { [weak self, weak webView] in
            guard let self, let webView else { return }
            let temporaryURL = FileManager.default.temporaryDirectory.appendingPathComponent("ysb-drop-\(UUID().uuidString).\(fileExtension)")
            defer { try? FileManager.default.removeItem(at: temporaryURL) }
            do {
                try data.write(to: temporaryURL, options: .atomic)
                if fileExtension == "apkg" {
                    self.callJavaScript("receiveAnkiPackageImport", payload: try self.readAnkiPackage(at: temporaryURL).merging(["name": name]) { _, new in new }, in: webView)
                } else {
                    let text = fileExtension == "pdf" ? try self.readPDF(at: temporaryURL) : try self.readPowerPoint(at: temporaryURL)
                    self.callJavaScript(documentResultHandler, payload: ["name": name, "extension": fileExtension, "text": text], in: webView)
                }
            } catch { self.callJavaScript(fileExtension == "apkg" ? "receiveAnkiPackageImportError" : documentErrorHandler, payload: error.localizedDescription, in: webView) }
        }
    }

    private func chooseNotebookImportFile(in webView: WKWebView?) {
        guard let webView else { return }
        let panel = NSOpenPanel()
        panel.title = "Import notes"
        panel.prompt = "Import"
        panel.message = "Choose a PDF, PowerPoint, text, or Markdown file to add to Notes."
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.allowedContentTypes = [.item]

        let handleSelection: (NSApplication.ModalResponse) -> Void = { [weak self, weak webView] response in
            guard let self, let webView, response == .OK, let url = panel.url else { return }
            let fileExtension = url.pathExtension.lowercased()
            guard ["pdf", "pptx", "txt", "md"].contains(fileExtension) else {
                self.callJavaScript("receiveNotebookDocumentImportError", payload: "Choose a PDF, PowerPoint, TXT, or Markdown file.", in: webView)
                return
            }
            self.callJavaScript("receiveNotebookDocumentImportStatus", payload: "Reading \(url.lastPathComponent)…", in: webView)
            DispatchQueue.global(qos: .userInitiated).async { [weak self, weak webView] in
                guard let self, let webView else { return }
                do {
                    let text: String
                    if fileExtension == "pdf" {
                        text = try self.readPDF(at: url)
                    } else if fileExtension == "pptx" {
                        text = try self.readPowerPoint(at: url)
                    } else {
                        text = try String(contentsOf: url, encoding: .utf8)
                    }
                    self.callJavaScript("receiveNotebookDocumentImport", payload: ["name": url.lastPathComponent, "extension": fileExtension, "text": text], in: webView)
                } catch {
                    self.callJavaScript("receiveNotebookDocumentImportError", payload: error.localizedDescription, in: webView)
                }
            }
        }

        if let window {
            panel.beginSheetModal(for: window, completionHandler: handleSelection)
        } else {
            handleSelection(panel.runModal())
        }
    }

    private func setWindowFullscreen(_ active: Bool) {
        guard let window else { return }
        let isFullscreen = window.styleMask.contains(.fullScreen)
        if active != isFullscreen { window.toggleFullScreen(nil) }
    }

    private func exportStudySet(_ payload: [String: Any]) {
        let format = (payload["format"] as? String) ?? "apkg"
        let rawName = (payload["name"] as? String) ?? "study-set"
        let safeName = rawName.replacingOccurrences(of: "[^A-Za-z0-9._ -]", with: "-", options: .regularExpression)
        let panel = NSSavePanel()
        panel.title = "Export study set"
        panel.nameFieldStringValue = "\(safeName).\(format)"
        if let type = UTType(filenameExtension: format) { panel.allowedContentTypes = [type] }
        let completion: (NSApplication.ModalResponse) -> Void = { response in
            guard response == .OK, let url = panel.url else { return }
            do {
                if format == "apkg" { try self.writeAnkiPackage(payload, to: url) }
                else { try self.exportData(payload, format: format).write(to: url, options: .atomic) }
            } catch {
                let alert = NSAlert(); alert.messageText = "The study set couldn’t be exported"; alert.informativeText = error.localizedDescription; alert.alertStyle = .warning; alert.runModal()
            }
        }
        if let window { panel.beginSheetModal(for: window, completionHandler: completion) } else { completion(panel.runModal()) }
    }

    private func exportNote(_ payload: [String: Any]) {
        let allowedExtensions = ["png", "html", "txt", "pdf"]
        let requestedExtension = (payload["extension"] as? String)?.lowercased() ?? "png"
        let fileExtension = allowedExtensions.contains(requestedExtension) ? requestedExtension : "png"
        let rawName = (payload["name"] as? String) ?? "Note"
        let safeName = rawName.replacingOccurrences(of: "[^A-Za-z0-9._ -]", with: "-", options: .regularExpression)
        guard let encoded = payload["data"] as? String,
              let comma = encoded.firstIndex(of: ","),
              let data = Data(base64Encoded: String(encoded[encoded.index(after: comma)...])) else {
            let alert = NSAlert(); alert.messageText = "The note couldn’t be exported"; alert.informativeText = "The exported note data could not be decoded."; alert.alertStyle = .warning; alert.runModal()
            return
        }
        let panel = NSSavePanel()
        panel.title = "Export note"
        panel.nameFieldStringValue = "\(safeName).\(fileExtension)"
        if let type = UTType(filenameExtension: fileExtension) { panel.allowedContentTypes = [type] }
        let completion: (NSApplication.ModalResponse) -> Void = { response in
            guard response == .OK, let url = panel.url else { return }
            do { try data.write(to: url, options: .atomic) }
            catch {
                let alert = NSAlert(); alert.messageText = "The note couldn’t be exported"; alert.informativeText = error.localizedDescription; alert.alertStyle = .warning; alert.runModal()
            }
        }
        if let window { panel.beginSheetModal(for: window, completionHandler: completion) }
        else { completion(panel.runModal()) }
    }

    private func exportData(_ payload: [String: Any], format: String) throws -> Data {
        if format == "json" { return try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]) }
        let delimiter = format == "csv" ? "," : "\t"
        let cards = payload["cards"] as? [[String: Any]] ?? []
        func quoted(_ value: Any?) -> String { "\"\(String(describing: value ?? "").replacingOccurrences(of: "\"", with: "\"\""))\"" }
        let rows = [["Front", "Back"]] + cards.map { [String(describing: $0["front"] ?? ""), String(describing: $0["back"] ?? "")] }
        return rows.map { $0.map { quoted($0) }.joined(separator: delimiter) }.joined(separator: "\r\n").data(using: .utf8)!
    }

    private func sqlText(_ value: String) -> String {
        let hex = value.data(using: .utf8)!.map { String(format: "%02x", $0) }.joined()
        return "CAST(X'\(hex)' AS TEXT)"
    }

    private func writeAnkiPackage(_ payload: [String: Any], to destination: URL) throws {
        let fm = FileManager.default
        let folder = fm.temporaryDirectory.appendingPathComponent("ysb-export-\(UUID().uuidString)", isDirectory: true)
        try fm.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: folder) }
        let database = folder.appendingPathComponent("collection.anki2")
        let media = folder.appendingPathComponent("media")
        let now = Int(Date().timeIntervalSince1970), modelID = now * 1000, deckID = modelID + 1
        let deckName = String(describing: payload["name"] ?? "Study set")
        let model = "{\"\(modelID)\":{\"id\":\(modelID),\"name\":\"Your Study Buddy\",\"type\":0,\"mod\":\(now),\"usn\":-1,\"sortf\":0,\"did\":\(deckID),\"tmpls\":[{\"name\":\"Card 1\",\"ord\":0,\"qfmt\":\"{{Front}}\",\"afmt\":\"{{FrontSide}}<hr id=answer>{{Back}}\",\"bqfmt\":\"\",\"bafmt\":\"\",\"did\":null}],\"flds\":[{\"name\":\"Front\",\"ord\":0,\"sticky\":false,\"rtl\":false,\"font\":\"Arial\",\"size\":20,\"media\":[]},{\"name\":\"Back\",\"ord\":1,\"sticky\":false,\"rtl\":false,\"font\":\"Arial\",\"size\":20,\"media\":[]}],\"css\":\".card { font-family: arial; font-size: 20px; text-align: center; }\",\"req\":[[0,\"any\",[0]]]}}"
        let deckJSON = "{\"\(deckID)\":{\"id\":\(deckID),\"name\":\"\(deckName.replacingOccurrences(of: "\"", with: "\\\""))\",\"mod\":\(now),\"usn\":-1,\"desc\":\"Exported from Your Study Buddy\",\"dyn\":0,\"collapsed\":false,\"browserCollapsed\":false,\"conf\":1,\"extendNew\":0,\"extendRev\":0,\"lrnToday\":[0,0],\"revToday\":[0,0],\"newToday\":[0,0],\"timeToday\":[0,0],\"reviewLimit\":null,\"newLimit\":null,\"reviewLimitToday\":null,\"newLimitToday\":null},\"1\":{\"id\":1,\"name\":\"Default\",\"mod\":0,\"usn\":0,\"desc\":\"\",\"dyn\":0,\"collapsed\":true,\"browserCollapsed\":true,\"conf\":1,\"extendNew\":0,\"extendRev\":0,\"lrnToday\":[0,0],\"revToday\":[0,0],\"newToday\":[0,0],\"timeToday\":[0,0],\"reviewLimit\":null,\"newLimit\":null,\"reviewLimitToday\":null,\"newLimitToday\":null}}"
        var sql = "CREATE TABLE col (id integer primary key,crt integer not null,mod integer not null,scm integer not null,ver integer not null,dty integer not null,usn integer not null,ls integer not null,conf text not null,models text not null,decks text not null,dconf text not null,tags text not null); CREATE TABLE notes (id integer primary key,guid text not null,mid integer not null,mod integer not null,usn integer not null,tags text not null,flds text not null,sfld integer not null,csum integer not null,flags integer not null,data text not null); CREATE TABLE cards (id integer primary key,nid integer not null,did integer not null,ord integer not null,mod integer not null,usn integer not null,type integer not null,queue integer not null,due integer not null,ivl integer not null,factor integer not null,reps integer not null,lapses integer not null,left integer not null,odue integer not null,odid integer not null,flags integer not null,data text not null); CREATE TABLE revlog (id integer primary key,cid integer not null,usn integer not null,ease integer not null,ivl integer not null,lastIvl integer not null,factor integer not null,time integer not null,type integer not null); CREATE TABLE graves (usn integer not null,oid integer not null,type integer not null); INSERT INTO col VALUES(1,\(now),\(now * 1000),\(now * 1000),11,0,0,0,'{}',\(sqlText(model)),\(sqlText(deckJSON)),'{}','{}');"
        let cards = payload["cards"] as? [[String: Any]] ?? []
        var exportedCardIDs: [String: Int] = [:]
        var mediaMap: [String: String] = [:]
        var mediaURLs: [URL] = []
        func field(_ text: String, image: Any?, side: String, index: Int) throws -> String {
            var html = text
            guard let source = image as? String,
                  let comma = source.firstIndex(of: ","),
                  source.hasPrefix("data:image/") else { return html }
            let header = String(source[..<comma])
            let encoded = String(source[source.index(after: comma)...])
            guard header.contains(";base64"), let data = Data(base64Encoded: encoded) else { return html }
            let ext: String
            if header.contains("image/jpeg") { ext = "jpg" }
            else if header.contains("image/gif") { ext = "gif" }
            else if header.contains("image/webp") { ext = "webp" }
            else if header.contains("image/svg") { ext = "svg" }
            else { ext = "png" }
            let filename = "ysb-\(index + 1)-\(side).\(ext)"
            let archiveName = String(mediaURLs.count)
            let fileURL = folder.appendingPathComponent(archiveName)
            try data.write(to: fileURL)
            mediaURLs.append(fileURL)
            mediaMap[archiveName] = filename
            if !html.isEmpty { html += "<br>" }
            html += "<img src=\"\(filename)\">"
            return html
        }
        for (index, card) in cards.enumerated() {
            let noteID = modelID + 10 + index * 2
            let cardID = noteID + 1
            if let scheduleKey = card["scheduleKey"] as? String { exportedCardIDs[scheduleKey] = cardID }
            let front = try field(String(describing: card["front"] ?? ""), image: card["frontImage"], side: "front", index: index)
            let back = try field(String(describing: card["back"] ?? ""), image: card["backImage"], side: "back", index: index)
            let schedule = card["schedule"] as? [String: Any] ?? [:]
            let fsrs = schedule["fsrs"] as? [String: Any] ?? [:]
            let state = (fsrs["state"] as? NSNumber)?.intValue ?? (schedule["state"] as? NSNumber)?.intValue ?? 0
            let suspended = (schedule["suspended"] as? Bool) ?? false
            let queue = suspended ? -1 : state == 0 ? 0 : state == 2 ? 2 : 1
            let dueMS = (fsrs["due"] as? NSNumber)?.int64Value ?? (schedule["due"] as? NSNumber)?.int64Value ?? Int64(now * 1000)
            let due = queue == 2 ? max(1, Int((dueMS / 1000 - Int64(now)) / 86400)) : queue == 1 ? Int(dueMS / 1000) : index + 1
            let interval = (fsrs["scheduled_days"] as? NSNumber)?.intValue ?? (schedule["intervalDays"] as? NSNumber)?.intValue ?? 0
            let reps = (fsrs["reps"] as? NSNumber)?.intValue ?? (schedule["repetitions"] as? NSNumber)?.intValue ?? 0
            let lapses = (fsrs["lapses"] as? NSNumber)?.intValue ?? (schedule["lapses"] as? NSNumber)?.intValue ?? 0
            let stability = (fsrs["stability"] as? NSNumber)?.doubleValue ?? 0
            let difficulty = (fsrs["difficulty"] as? NSNumber)?.doubleValue ?? 0
            let cardData = stability > 0 ? "{\"s\":\(stability),\"d\":\(difficulty)}" : ""
            sql += " INSERT INTO notes VALUES(\(noteID),'ysb\(noteID)',\(modelID),\(now),-1,'',\(sqlText(front + "\u{001F}" + back)),\(sqlText(front)),0,0,''); INSERT INTO cards VALUES(\(cardID),\(noteID),\(deckID),0,\(now),-1,\(state == 2 ? 2 : state == 0 ? 0 : 1),\(queue),\(due),\(interval),0,\(reps),\(lapses),0,0,0,0,\(sqlText(cardData)));"
        }
        let reviewLogs = payload["reviewLogs"] as? [[String: Any]] ?? []
        for (index, log) in reviewLogs.enumerated() {
            guard let key = log["cardKey"] as? String, let cardID = exportedCardIDs[key] else { continue }
            let reviewID = max(now * 1000 + index, (log["review"] as? NSNumber)?.intValue ?? now * 1000 + index)
            let rating = ["again": 1, "hard": 2, "good": 3, "easy": 4][log["rating"] as? String ?? "good"] ?? 3
            let interval = (log["scheduledDays"] as? NSNumber)?.intValue ?? 0
            let duration = (log["durationMs"] as? NSNumber)?.intValue ?? 0
            let type = (log["state"] as? NSNumber)?.intValue ?? 1
            sql += " INSERT INTO revlog VALUES(\(reviewID),\(cardID),-1,\(rating),\(interval),0,0,\(duration),\(type));"
        }
        _ = try runProcess("/usr/bin/sqlite3", arguments: [database.path, sql])
        try JSONSerialization.data(withJSONObject: mediaMap, options: [.sortedKeys]).write(to: media)
        if fm.fileExists(atPath: destination.path) { try fm.removeItem(at: destination) }
        _ = try runProcess("/usr/bin/zip", arguments: ["-j", destination.path, database.path, media.path] + mediaURLs.map(\.path))
    }

    private func installMainMenu() {
        let mainMenu = NSMenu()

        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Your Study Buddy", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit Your Study Buddy", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu

        let editMenuItem = NSMenuItem()
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenu.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        let redo = editMenu.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        redo.keyEquivalentModifierMask = [.command, .shift]
        editMenu.addItem(.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editMenuItem.submenu = editMenu

        NSApp.mainMenu = mainMenu
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url,
           navigationAction.navigationType == .linkActivated,
           url.scheme == "http" || url.scheme == "https" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        let panel = NSOpenPanel()
        panel.title = "Choose a file"
        panel.prompt = "Choose"
        panel.message = "Choose an image, Anki APKG package, or notes export."
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        // PPTX and APKG are ZIP-based formats. On Macs without Microsoft Office,
        // Launch Services can report them as unrelated dynamic types and gray
        // them out when a narrow content-type filter is used. Allow files here
        // and validate the extension after selection instead.
        panel.allowedContentTypes = [.item]

        if let window {
            panel.beginSheetModal(for: window) { response in
                self.finishFileSelection(response: response, urls: panel.urls, webView: webView, completionHandler: completionHandler)
            }
        } else {
            let response = panel.runModal()
            finishFileSelection(response: response, urls: panel.urls, webView: webView, completionHandler: completionHandler)
        }
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = "Are you sure?"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Confirm")
        alert.addButton(withTitle: "Cancel")
        if let window {
            alert.beginSheetModal(for: window) { response in completionHandler(response == .alertFirstButtonReturn) }
        } else {
            completionHandler(alert.runModal() == .alertFirstButtonReturn)
        }
    }

    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        let alert = NSAlert()
        alert.messageText = prompt
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Continue")
        alert.addButton(withTitle: "Cancel")
        let input = NSTextField(string: defaultText ?? "")
        input.frame = NSRect(x: 0, y: 0, width: 280, height: 26)
        alert.accessoryView = input
        let finish: (NSApplication.ModalResponse) -> Void = { response in
            completionHandler(response == .alertFirstButtonReturn ? input.stringValue : nil)
        }
        if let window {
            alert.beginSheetModal(for: window, completionHandler: finish)
        } else {
            finish(alert.runModal())
        }
    }

    private func finishFileSelection(
        response: NSApplication.ModalResponse,
        urls: [URL],
        webView: WKWebView,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        guard response == .OK, !urls.isEmpty else {
            completionHandler(nil)
            return
        }
        // Return the selected file to the HTML input that opened the panel.
        // Its own change handler knows whether this is a Notes import, a Create
        // import, an image, or an APKG. Intercepting PDF/PPTX files here used to
        // send every selection to Create, including files chosen from Notes.
        completionHandler(urls)
    }

    private func readPDF(at url: URL) throws -> String {
        guard let document = PDFDocument(url: url) else { throw PackageImportFailure(message: "This PDF could not be opened.") }
        let pages = (0..<document.pageCount).compactMap { index -> String? in
            guard let text = document.page(at: index)?.string?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else { return nil }
            let cleaned = cleanPDFSlide(text.components(separatedBy: .newlines))
            return cleaned.isEmpty ? nil : cleaned
        }
        guard !pages.isEmpty else { throw PackageImportFailure(message: "No usable study text was found. This may be a scanned PDF that requires OCR.") }
        return pages.joined(separator: "\n\n")
    }

    private func cleanPDFSlide(_ sourceLines: [String]) -> String {
        let lines = sourceLines.map { $0.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty && $0.range(of: #"(?:©|Copyright).*Worth Publishers|^page\s*\d+$"#, options: [.regularExpression, .caseInsensitive]) == nil }
        guard !lines.isEmpty else { return "" }
        let combined = lines.joined(separator: " ")
        if lines[0].range(of: #"^(?:True or False|Learning Targets?|Check Your Understanding|AP®? Exam Tip)\b"#, options: [.regularExpression, .caseInsensitive]) != nil || combined.range(of: #"(?:Examine the Concept|Apply the Concept).*(?:Examine the Concept|Apply the Concept)"#, options: [.regularExpression, .caseInsensitive]) != nil { return "" }
        if lines.count <= 2 && combined.count < 150 && !combined.contains(":") { return "" }
        var output: [String] = []
        for line in lines {
            let bullet = line.range(of: #"^(?:[•●▪◦*-]|\d+[.)])\s*"#, options: .regularExpression) != nil
            let cleaned = line.replacingOccurrences(of: #"^[•●▪◦]\s*"#, with: "- ", options: .regularExpression)
            if let previous = output.last, !bullet, previous.range(of: #"[.!?:;]$"#, options: .regularExpression) == nil, cleaned.range(of: #"^[a-z(]"#, options: .regularExpression) != nil {
                output[output.count - 1] = previous + " " + cleaned
            } else { output.append(cleaned) }
        }
        guard !output.isEmpty else { return "" }
        let first = output[0]
        let titleLike = first.count <= 90 && first.range(of: #"[.!?]$"#, options: .regularExpression) == nil && first.range(of: #"^[•*-]"#, options: .regularExpression) == nil && first.range(of: #"^[^:]{2,60}:\s+.+"#, options: .regularExpression) == nil
        if titleLike { output[0] = "## " + first }
        return output.joined(separator: "\n")
    }

    private func readPowerPoint(at url: URL) throws -> String {
        let listingData = try runProcess("/usr/bin/unzip", arguments: ["-Z1", url.path])
        let listing = String(data: listingData, encoding: .utf8) ?? ""
        let slides = listing.split(whereSeparator: \.isNewline).map(String.init).filter { $0.range(of: #"^ppt/slides/slide\d+\.xml$"#, options: .regularExpression) != nil }.sorted {
            let a = Int($0.replacingOccurrences(of: #"\D"#, with: "", options: .regularExpression)) ?? 0
            let b = Int($1.replacingOccurrences(of: #"\D"#, with: "", options: .regularExpression)) ?? 0
            return a < b
        }
        guard !slides.isEmpty else { throw PackageImportFailure(message: "No readable slides were found in this PowerPoint.") }
        var extracted = try slides.compactMap { slide -> String? in
            let data = try runProcess("/usr/bin/unzip", arguments: ["-p", url.path, slide])
            let xml = String(data: data, encoding: .utf8) ?? ""
            let result = try powerpointSlideText(xml)
            return result.isEmpty ? nil : result
        }
        if let start = extracted.firstIndex(where: { $0.range(of: #"^##\s+(?:unit|chapter|topic|module)\s+\d+\b"#, options: [.regularExpression, .caseInsensitive]) != nil }), start >= 3 { extracted = Array(extracted[start...]) }
        guard !extracted.isEmpty else { throw PackageImportFailure(message: "No usable study text was found in this PowerPoint.") }
        return extracted.joined(separator: "\n\n")
    }

    private func regexGroups(_ pattern: String, in text: String, group: Int = 1) throws -> [String] {
        let expression = try NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators])
        return expression.matches(in: text, range: NSRange(text.startIndex..., in: text)).compactMap { match in
            guard match.numberOfRanges > group, let range = Range(match.range(at: group), in: text) else { return nil }
            return String(text[range])
        }
    }

    private func decodePowerPointXML(_ value: String) -> String {
        value.replacingOccurrences(of: "&amp;", with: "&").replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">").replacingOccurrences(of: "&quot;", with: "\"").replacingOccurrences(of: "&apos;", with: "'")
    }

    private func powerpointParagraph(_ xml: String) throws -> String? {
        let levelExpression = try NSRegularExpression(pattern: #"<a:pPr[^>]*\blvl="(\d+)""#)
        var level = 0
        if let match = levelExpression.firstMatch(in: xml, range: NSRange(xml.startIndex..., in: xml)), let range = Range(match.range(at: 1), in: xml) { level = Int(xml[range]) ?? 0 }
        let runs = try regexGroups(#"<a:r>(.*?)</a:r>"#, in: xml)
        var parts: [String] = []
        for run in runs {
            let text = try regexGroups(#"<a:t>(.*?)</a:t>"#, in: run).map(decodePowerPointXML).joined()
            if text.isEmpty { continue }
            let bold = run.range(of: #"<a:rPr[^>]*\bb="1""#, options: .regularExpression) != nil
            let italic = run.range(of: #"<a:rPr[^>]*\bi="1""#, options: .regularExpression) != nil
            if !text.trimmingCharacters(in: .whitespaces).isEmpty && bold && italic { parts.append("***\(text)***") }
            else if !text.trimmingCharacters(in: .whitespaces).isEmpty && bold { parts.append("**\(text)**") }
            else if !text.trimmingCharacters(in: .whitespaces).isEmpty && italic { parts.append("*\(text)*") }
            else { parts.append(text) }
        }
        if parts.isEmpty { parts = try regexGroups(#"<a:t>(.*?)</a:t>"#, in: xml).map(decodePowerPointXML) }
        let text = parts.joined().replacingOccurrences(of: #"[ \t]+([,.;:!?])"#, with: "$1", options: .regularExpression).replacingOccurrences(of: #"[ \t]{2,}"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }
        let numbered = text.range(of: #"^\s*(?:\d+|[A-Z])\s*[.)]\s+"#, options: .regularExpression) != nil
        return String(repeating: "  ", count: max(0, level)) + (numbered ? "" : "- ") + text
    }

    private func powerpointSlideText(_ xml: String) throws -> String {
        let shapes = try regexGroups(#"<p:sp>(.*?)</p:sp>"#, in: xml)
        var title = "", body: [String] = []
        for shape in shapes {
            let paragraphs = try regexGroups(#"<a:p>(.*?)</a:p>"#, in: shape).compactMap { try powerpointParagraph($0) }
            if paragraphs.isEmpty { continue }
            let isTitle = shape.range(of: #"<p:ph[^>]*\btype="(?:title|ctrTitle)""#, options: .regularExpression) != nil
            if isTitle && title.isEmpty { title = paragraphs.map { $0.replacingOccurrences(of: #"^\s*-\s*"#, with: "", options: .regularExpression).replacingOccurrences(of: "**", with: "") }.joined(separator: " ") }
            else { body.append(contentsOf: paragraphs) }
        }
        title = title.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
        let administrative = title.range(of: #"^(?:questions?|agenda|bell schedule|classroom expectations|reading guides?|contact information|about (?:me|the teacher)|homework|reminders?|materials|grading|course syllabus)$"#, options: [.regularExpression, .caseInsensitive]) != nil || title.range(of: #"(?:walkthrough|class activity|map activity|discussion questions?|ap daily|take notes|exam review directions)"#, options: [.regularExpression, .caseInsensitive]) != nil
        if administrative { return "" }
        var seen = Set<String>()
        let uniqueBody = body.filter { value in
            let plain = value.replacingOccurrences(of: #"^\s*-\s*"#, with: "", options: .regularExpression).replacingOccurrences(of: "**", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
            let instructional = plain.range(of: #"^(?:watch|begin at|turn to|complete|submit|discuss with|take notes|answer the following)\b"#, options: [.regularExpression, .caseInsensitive]) != nil
            let bareURL = plain.range(of: #"^https?://\S+$"#, options: [.regularExpression, .caseInsensitive]) != nil
            return value.count > 2 && seen.insert(value).inserted && !bareURL && !plain.hasSuffix("?") && !instructional
        }
        if title.isEmpty && uniqueBody.isEmpty { return "" }
        return ((title.isEmpty ? [] : ["## \(title)"]) + uniqueBody).joined(separator: "\n")
    }

    private func readAnkiPackage(at archiveURL: URL) throws -> [String: Any] {
        let fileManager = FileManager.default
        let temporaryDirectory = fileManager.temporaryDirectory.appendingPathComponent("your-study-buddy-apkg-\(UUID().uuidString)", isDirectory: true)
        try fileManager.createDirectory(at: temporaryDirectory, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: temporaryDirectory) }

        let listingData = try runProcess("/usr/bin/unzip", arguments: ["-Z1", archiveURL.path])
        guard let listing = String(data: listingData, encoding: .utf8) else {
            throw PackageImportFailure(message: "This APKG package has an unreadable file list.")
        }
        let entries = Set(listing.split(whereSeparator: \.isNewline).map(String.init))
        let databaseURL = temporaryDirectory.appendingPathComponent("collection.sqlite")

        if entries.contains("collection.anki21") {
            let data = try runProcess("/usr/bin/unzip", arguments: ["-p", archiveURL.path, "collection.anki21"])
            try data.write(to: databaseURL, options: .atomic)
        } else if entries.contains("collection.anki21b") {
            guard let zstdPath = zstdExecutablePath() else {
                throw PackageImportFailure(message: "This is a modern compressed APKG. Re-export it from Anki with “Support older Anki versions” enabled, then import it again.")
            }
            let compressedURL = temporaryDirectory.appendingPathComponent("collection.anki21b")
            let data = try runProcess("/usr/bin/unzip", arguments: ["-p", archiveURL.path, "collection.anki21b"])
            try data.write(to: compressedURL, options: .atomic)
            _ = try runProcess(zstdPath, arguments: ["-d", "-q", "-f", compressedURL.path, "-o", databaseURL.path])
        } else if entries.contains("collection.anki2") {
            let data = try runProcess("/usr/bin/unzip", arguments: ["-p", archiveURL.path, "collection.anki2"])
            try data.write(to: databaseURL, options: .atomic)
        } else {
            throw PackageImportFailure(message: "No Anki collection database was found inside this APKG package.")
        }

        let databaseHeader = try Data(contentsOf: databaseURL, options: .mappedIfSafe).prefix(16)
        guard String(data: databaseHeader, encoding: .utf8)?.hasPrefix("SQLite format 3") == true else {
            throw PackageImportFailure(message: "The Anki database inside this APKG package could not be decoded.")
        }

        let query = "SELECT n.id,n.flds,c.id AS cardId,c.type,c.queue,c.due,c.ivl,c.factor,c.reps,c.lapses,c.left,c.data,(SELECT crt FROM col LIMIT 1) AS crt,(SELECT json_group_array(json_object('rating',r.ease,'interval',r.ivl,'lastInterval',r.lastIvl,'factor',r.factor,'durationMs',r.time,'type',r.type,'review',r.id)) FROM revlog r WHERE r.cid=c.id ORDER BY r.id) AS reviews FROM notes n LEFT JOIN cards c ON c.nid=n.id ORDER BY n.id,c.ord;"
        let notesData = try runProcess("/usr/bin/sqlite3", arguments: ["-json", databaseURL.path, query])
        guard let rows = try JSONSerialization.jsonObject(with: notesData) as? [[String: Any]] else {
            throw PackageImportFailure(message: "The notes inside this APKG package could not be read.")
        }
        let notes: [[String: Any]] = rows.compactMap { row in
            guard let fields = row["flds"] as? String else { return nil }
            let queue = (row["queue"] as? NSNumber)?.intValue ?? 0
            let due = (row["due"] as? NSNumber)?.int64Value ?? 0
            let created = (row["crt"] as? NSNumber)?.int64Value ?? Int64(Date().timeIntervalSince1970)
            let dueTimestamp = queue == 1 ? due * 1000 : (created + due * 86400) * 1000
            var reviews: [[String: Any]] = []
            if let reviewJSON = row["reviews"] as? String, let reviewData = reviewJSON.data(using: .utf8), let parsed = try? JSONSerialization.jsonObject(with: reviewData) as? [[String: Any]] { reviews = parsed }
            let type = (row["type"] as? NSNumber)?.intValue ?? 0
            var stability = 0.0
            var difficulty = 0.0
            if let customJSON = row["data"] as? String, let customData = customJSON.data(using: .utf8), let custom = try? JSONSerialization.jsonObject(with: customData) as? [String: Any] {
                stability = (custom["s"] as? NSNumber)?.doubleValue ?? (custom["stability"] as? NSNumber)?.doubleValue ?? 0
                difficulty = (custom["d"] as? NSNumber)?.doubleValue ?? (custom["difficulty"] as? NSNumber)?.doubleValue ?? 0
            }
            return [
                "id": row["id"] ?? UUID().uuidString,
                "cardId": row["cardId"] ?? 0,
                "fields": fields.components(separatedBy: "\u{001F}"),
                "schedule": ["due": dueTimestamp, "intervalDays": (row["ivl"] as? NSNumber)?.intValue ?? 0, "repetitions": (row["reps"] as? NSNumber)?.intValue ?? 0, "lapses": (row["lapses"] as? NSNumber)?.intValue ?? 0, "ease": Double((row["factor"] as? NSNumber)?.intValue ?? 2500) / 1000.0, "state": type == 2 ? 2 : type == 3 ? 3 : type == 1 ? 1 : 0, "suspended": queue < 0, "learningSteps": (row["left"] as? NSNumber)?.intValue ?? 0, "stability": stability, "difficulty": difficulty],
                "reviews": reviews
            ]
        }
        guard !notes.isEmpty else {
            throw PackageImportFailure(message: "This APKG package does not contain any notes.")
        }
        return ["name": archiveURL.lastPathComponent, "notes": notes]
    }

    private func zstdExecutablePath() -> String? {
        ["/opt/homebrew/bin/zstd", "/usr/local/bin/zstd", "/opt/anaconda3/bin/zstd"].first {
            FileManager.default.isExecutableFile(atPath: $0)
        }
    }

    private func runProcess(_ executable: String, arguments: [String]) throws -> Data {
        let process = Process()
        let output = Pipe()
        let errors = Pipe()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments
        process.standardOutput = output
        process.standardError = errors
        do {
            try process.run()
        } catch {
            throw PackageImportFailure(message: "The APKG importer could not start: \(error.localizedDescription)")
        }
        let data = output.fileHandleForReading.readDataToEndOfFile()
        let errorData = errors.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else {
            let message = String(data: errorData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
            throw PackageImportFailure(message: message?.isEmpty == false ? message! : "The APKG package could not be unpacked.")
        }
        return data
    }

    private func callJavaScript(_ functionName: String, payload: Any, in webView: WKWebView) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.fragmentsAllowed]) else { return }
        let base64 = data.base64EncodedString()
        let script = "window.\(functionName)(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('\(base64)'), c => c.charCodeAt(0)))));"
        DispatchQueue.main.async {
            webView.evaluateJavaScript(script, completionHandler: nil)
        }
    }

    private func presentLaunchError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "Your Study Buddy couldn’t open"
        alert.informativeText = message
        alert.alertStyle = .critical
        alert.runModal()
    }
}

@main
struct StudyDeskApplication {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.setActivationPolicy(.regular)
        app.run()
        _ = delegate
    }
}
