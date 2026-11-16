const run = `# backend
cd backend
python -m venv .venv && .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend (second terminal)
cd frontend
npm install
npm run dev`

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <section className="card p-5">
        <p className="tag mb-2">Course</p>
        <p>CSST106 – Perception and Computer Vision · BSCS 4A · 1st Semester, A.Y. 2026–2027 · Instructor: Jeremy C. Reyes.</p>
      </section>
      <section className="card p-5">
        <p className="tag mb-2">How to run</p>
        <pre className="overflow-x-auto rounded-md bg-panel2 p-3 font-mono text-xs leading-relaxed">{run}</pre>
        <p className="mt-3 text-sm text-muted">Frontend: http://localhost:5173 · Backend: http://127.0.0.1:8000 (docs at /docs).</p>
      </section>
      <section className="card p-5">
        <p className="tag mb-2">Good to know</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>SURF is patented and needs an OpenCV contrib build with non-free enabled. Without it, Lab 4 falls back to ORB and says so.</li>
          <li>The first Lab 5 run downloads the LFW faces (~200 MB) and trains the model once.</li>
          <li>YOLO and DeepLabV3 weights download automatically the first time they are used.</li>
          <li>Progress, observations and conclusions are stored in your browser only.</li>
        </ul>
      </section>
      <section className="card p-5">
        <p className="tag mb-2">Credits</p>
        <p className="text-sm text-muted">Built with React, Vite, Tailwind, Recharts, FastAPI, OpenCV, scikit-learn, Ultralytics and PyTorch.</p>
      </section>
    </div>
  )
}
