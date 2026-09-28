import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

// usage: cutout <in.jpg> <out.png> [mask.png]
let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: inURL) else { fatalError("cannot read") }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { fatalError("no subject") }
print("instances:", obs.allInstances.count)
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: cs)
if args.count > 3 {
  let m = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
  try ctx.writePNGRepresentation(of: CIImage(cvPixelBuffer: m), to: URL(fileURLWithPath: args[3]), format: .L8, colorSpace: CGColorSpace(name: CGColorSpace.linearGray)!)
}
print("ok", out.extent)
