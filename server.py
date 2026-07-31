#!/usr/bin/env python3
"""
Serveur web simple pour servir l'application TGNova
Résout les erreurs CORS liées au protocole file://
"""

import http.server
import socketserver
import os
import sys

# Port du serveur
PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Ajouter les headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Format de log personnalisé
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

# Changer le répertoire de travail
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Créer et démarrer le serveur
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🚀 Serveur démarré sur http://localhost:{PORT}")
    print(f"📁 Répertoire servi: {os.getcwd()}")
    print("Appuyez sur Ctrl+C pour arrêter le serveur\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✅ Serveur arrêté")
        sys.exit(0)
