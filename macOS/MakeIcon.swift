import AppKit

let canvas = NSImage(size: NSSize(width: 1024, height: 1024))
canvas.lockFocus()

let background = NSBezierPath(roundedRect: NSRect(x: 52, y: 52, width: 920, height: 920), xRadius: 220, yRadius: 220)
NSColor(calibratedRed: 0.36, green: 0.36, blue: 0.84, alpha: 1).setFill()
background.fill()

let glow = NSBezierPath(ovalIn: NSRect(x: 300, y: 480, width: 610, height: 610))
NSColor(calibratedRed: 0.53, green: 0.54, blue: 0.95, alpha: 0.52).setFill()
glow.fill()

let page = NSBezierPath()
page.move(to: NSPoint(x: 250, y: 718))
page.line(to: NSPoint(x: 515, y: 718))
page.curve(to: NSPoint(x: 708, y: 525), controlPoint1: NSPoint(x: 622, y: 718), controlPoint2: NSPoint(x: 708, y: 632))
page.line(to: NSPoint(x: 708, y: 270))
page.line(to: NSPoint(x: 443, y: 270))
page.curve(to: NSPoint(x: 250, y: 463), controlPoint1: NSPoint(x: 336, y: 270), controlPoint2: NSPoint(x: 250, y: 356))
page.close()
NSColor.white.setFill()
page.fill()

let fold = NSBezierPath()
fold.move(to: NSPoint(x: 443, y: 270))
fold.line(to: NSPoint(x: 443, y: 620))
fold.curve(to: NSPoint(x: 515, y: 718), controlPoint1: NSPoint(x: 443, y: 674), controlPoint2: NSPoint(x: 468, y: 708))
fold.lineWidth = 24
NSColor(calibratedRed: 0.36, green: 0.36, blue: 0.84, alpha: 1).setStroke()
fold.stroke()

for y in [560.0, 475.0] {
    let line = NSBezierPath()
    line.move(to: NSPoint(x: 510, y: y))
    line.line(to: NSPoint(x: 640, y: y))
    line.lineWidth = 18
    line.lineCapStyle = .round
    NSColor(calibratedRed: 0.70, green: 0.71, blue: 0.93, alpha: 1).setStroke()
    line.stroke()
}

canvas.unlockFocus()

guard
    let tiff = canvas.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
else { exit(1) }

try png.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
