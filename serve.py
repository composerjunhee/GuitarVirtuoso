# Dev server: python serve.py  →  http://localhost:8000
# localhost is a secure context, so getUserMedia (mic) works without HTTPS.
import http.server
import functools

PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Service workers must not come from a stale cache.
        if self.path.endswith('sw.js'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.webmanifest'):
            return 'application/manifest+json'
        return super().guess_type(path)


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(
        ('', PORT), functools.partial(Handler)).serve_forever()
