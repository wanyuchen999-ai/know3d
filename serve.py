# -*- coding: utf-8 -*-
"""智观3D 本地服务器 — 零依赖,双击「启动.bat」即可运行
在 http://localhost:8765 提供静态文件服务,并自动打开浏览器。"""
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('KNOW3D_PORT', '8765'))
MIME = {
    '.glb': 'model/gltf-binary', '.obj': 'application/octet-stream',
    '.gltf': 'model/gltf+json', '.json': 'application/json; charset=utf-8',
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.sdf': 'chemical/x-mdl-sdf',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **MIME}

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        pass  # 静默,避免控制台刷屏

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()


def port_free(p):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', p)) != 0


def main():
    port = PORT
    while not port_free(port) and port < PORT + 20:
        port += 1
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1', port), Handler) as httpd:
        url = f'http://localhost:{port}/index.html'
        print(f'智观3D 已启动: {url}')
        print('关闭此窗口即可退出服务。')
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
