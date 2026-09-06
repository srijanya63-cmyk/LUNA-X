import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from app.main import app

if __name__ == "__main__":
    while True:
        try:
            uvicorn.run(app, host="127.0.0.1", port=8001, loop="asyncio")
            break
        except KeyboardInterrupt:
            print("\nShutting down LUNA-X backend server...")
            sys.exit(0)
        except Exception as e:
            print(f"[WARN] Backend server encountered network socket error: {e}. Restarting...")
            import time
            time.sleep(1)
