import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();

const upload = multer({
  dest: "/tmp/omr-uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

router.post("/recognize", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image provided" });
  }

  const imagePath = req.file.path;
  const outputDir = path.dirname(imagePath);

  try {
    const musicXml = await runOMR(imagePath, outputDir);
    fs.unlinkSync(imagePath); // delete uploaded image
    res.json({ success: true, musicXml });
  } catch (error) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res
      .status(500)
      .json({ error: "Failed to recognize music", details: error.message });
  }
});

// OMR = optical Music Recognition
// homr is a Python tool that does OMR
function runOMR(imagePath, outputDir) {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(imagePath);
    const expectedOutput = path.join(outputDir, `${baseName}.musicxml`);

    // Spawn runs a shell command (like typing `homr image.png` in terminal)
    const proc = spawn("homr", [imagePath], {
      cwd: outputDir,
      env: {
        ...process.env,
        PATH: process.env.PATH + ":/Users/lizzyjoo/.local/bin",
      },
    });

    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      // code 0 means success
      if (code !== 0) {
        reject(new Error(`homr exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // homr created a .musicxml file, read it
        const musicXml = fs.readFileSync(expectedOutput, "utf-8");
        fs.unlinkSync(expectedOutput); // delete the output file
        resolve(musicXml);
      } catch (err) {
        reject(new Error(`Failed to read output: ${err.message}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start homr: ${err.message}`));
    });
  });
}

export default router;

// User uploads image
//        ↓
// Express receives it (multer saves to /tmp/)
//        ↓
// Your code runs `homr` command on that image
//        ↓
// homr analyzes the image and creates a .musicxml file
//        ↓
// code reads that .musicxml file
//        ↓
// returns the MusicXML content to frontend
//        ↓
// Frontend inserts it as a score node (tiptap)
