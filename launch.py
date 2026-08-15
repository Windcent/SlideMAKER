#!/usr/bin/env python3
"""
SlideMAKER Launcher
Starts the HTTP server and opens the presentation application in the default web browser.
"""

import os
import sys
import time
import webbrowser
import subprocess

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_script = os.path.join(script_dir, "server.py")

    print("==================================================")
    print("           SlideMAKER - Faculté de génie          ")
    print("==================================================")
    print(f"Starting local presentation server on port {PORT}...")

    # Start the server process
    server_proc = subprocess.Popen([sys.executable, server_script, str(PORT)])

    # Give server a moment to bind
    time.sleep(1)

    print(f"Opening browser at: {URL}")
    webbrowser.open(URL)

    print("\nSlideMAKER is running! Press Ctrl+C in this window to stop the server.")
    try:
        server_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping SlideMAKER server...")
        server_proc.terminate()
        server_proc.wait()
        print("Server stopped. Goodbye!")

if __name__ == "__main__":
    main()
