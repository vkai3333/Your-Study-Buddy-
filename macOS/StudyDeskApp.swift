import AppKit
import UniformTypeIdentifiers
import UserNotifications
import WebKit

private struct PackageImportFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

private final class StudyWebView: WKWebView {
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
        guard message.name == "studyAlarm", let payload = message.body as? [String: Any], let action = payload["action"] as? String, let identifier = payload["id"] as? String else { return }
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
        var importTypes: [UTType] = [.image, .plainText, .commaSeparatedText, .tabSeparatedText]
        if let packageType = UTType(filenameExtension: "apkg") { importTypes.append(packageType) }
        panel.allowedContentTypes = importTypes

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

    private func finishFileSelection(
        response: NSApplication.ModalResponse,
        urls: [URL],
        webView: WKWebView,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        guard response == .OK, let url = urls.first else {
            completionHandler(nil)
            return
        }
        guard url.pathExtension.lowercased() == "apkg" else {
            completionHandler(urls)
            return
        }

        completionHandler(nil)
        callJavaScript("receiveAnkiPackageStatus", payload: "Reading \(url.lastPathComponent)…", in: webView)
        DispatchQueue.global(qos: .userInitiated).async { [weak self, weak webView] in
            guard let self, let webView else { return }
            do {
                let payload = try self.readAnkiPackage(at: url)
                self.callJavaScript("receiveAnkiPackageImport", payload: payload, in: webView)
            } catch {
                self.callJavaScript("receiveAnkiPackageImportError", payload: error.localizedDescription, in: webView)
            }
        }
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

        let query = "SELECT id, flds FROM notes ORDER BY id;"
        let notesData = try runProcess("/usr/bin/sqlite3", arguments: ["-json", databaseURL.path, query])
        guard let rows = try JSONSerialization.jsonObject(with: notesData) as? [[String: Any]] else {
            throw PackageImportFailure(message: "The notes inside this APKG package could not be read.")
        }
        let notes: [[String: Any]] = rows.compactMap { row in
            guard let fields = row["flds"] as? String else { return nil }
            return [
                "id": row["id"] ?? UUID().uuidString,
                "fields": fields.components(separatedBy: "\u{001F}")
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
