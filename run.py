"""
Run the FastAPI app with host 0.0.0.0 and port from PORT env (e.g. Render).
Usage: python run.py
"""
import os

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
