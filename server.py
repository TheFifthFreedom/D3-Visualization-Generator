import cherrypy
import threading
import time
import json
import csv
import os
import requests

from cherrypy.lib.static import serve_file
from requests_ntlm import HttpNtlmAuth
from ldap3 import Server, Connection, SIMPLE, SYNC, ASYNC, SUBTREE, ALL

valid_sessions=[]

def purge_session_id(session_id):
    if session_id in valid_sessions:
        valid_sessions.remove(session_id)

class GraphingServer(object):

    @cherrypy.expose
    def index(self):
        # return open(os.path.abspath('html/index.html'))
        # Checking cookies
        request_cookie = cherrypy.request.cookie
        if request_cookie.keys() and request_cookie['session_id'].value in valid_sessions:
            return open(os.path.abspath('html/index.html'))
        else:
            return open(os.path.abspath('html/paywall.html'))

    @cherrypy.expose
    def authenticate(self, pid, pmName, userName):
        #PID Validation (to make sure it's a valid PID)
        pidOK = True
        session = requests.Session()
        session.auth = HttpNtlmAuth('sapient.com\\lmazou', 'Kus@n@g5', session)
        r1 = session.get('http://timetracking.sapient.com/')

        headers = {
            'Host': 'timetracking',
            'Connection': 'keep-alive',
            'Content-Length': '15',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Origin': 'http://timetracking',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36',
            'Content-Type': 'application/json; charset=UTF-8',
            'Referer': 'http://timetracking/EnterHours.aspx',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.8,fr;q=0.6'
        }
        payload = json.dumps({'Pid' : pid})

        r2 = session.post('http://timetracking/EnterHours.aspx/GetPidInfo', headers=headers, data=payload)
        if 'Not a valid PID!' in r2.text or 'not a valid value' in r2.text or pid == "63492" or pid == "104478":
            pidOK = False

        #PM Validation (to make sure it's actually a Sapient employee and a PM)
        pmOK = False
        pmEmail = ''
        s = Server('coloads1.sapient.com', port = 3268, get_info = ALL)
        c = Connection(s, auto_bind = True, client_strategy = SYNC, user='SAPIENT\lmazou', password='Kus@n@g5', authentication=SIMPLE, check_names=True)
        c.search('OU=Employee Users,OU=Accounts,DC=sapient,DC=com','(cn=' + pmName + ')', SUBTREE, attributes = ['description', 'mail'])
        response = c.response

        if response and ('Program Management' in response[0]['attributes']['description'][0] or pmName == 'Ryan Jones' or pmName == 'Rodrigo Stockebrand 2'):
            pmOK = True
            pmEmail = response[0]['attributes']['mail']

        #User validation (to make sure it's an actual Sapient employee)
        userOK = False
        c.search('OU=Employee Users,OU=Accounts,DC=sapient,DC=com','(cn=' + userName + ')', SUBTREE, attributes = ['description', 'mail'])
        response = c.response

        if response:
            userOK = True

        if pidOK and pmOK and userOK: # Everything checks out
            # Create authentication spoiler
            response_cookie = cherrypy.response.cookie
            response_cookie['session_id'] = cherrypy.lib.sessions.Session.generate_id(self)
            response_cookie['session_id']['path'] = '/'
            response_cookie['session_id']['expires'] = 1800
            # Whitelist the authentication cookie
            valid_sessions.append(response_cookie['session_id'].value)
            # Start a thread to purge that authentication cookie from the whitelist in 30min
            t = threading.Timer(1800, purge_session_id, [response_cookie['session_id'].value])
            t.start()
            # Email PM
            email_string = "This is an automatically generated e-mail to let you know that " + userName + " accessed the Sapient SEO Toolset on " + time.strftime("%c") + ", which will bill 30 minutes to PID#" + pid + ". Feel free to reply to this e-mail should you have any concerns."
            requests.post(
                "https://api.mailgun.net/v3/sandbox11b4340382ad4275897e64b56b9a099e.mailgun.org/messages",
                auth=("api", "key-427a6dea1d992181f35def2e501d8f27"),
                data={"from": "Laurent Mazouer <lmazouer@sapient.com>",
                      "to": pmEmail,
                      "subject": "*** Sapient SEO Tools Usage Notification ***",
                      "text": email_string})
            # Log the authentication
            f = open(os.path.abspath('sessions_log/log'), 'a')
            f.write(time.strftime("%c") + " | PID: " + pid + " | PM: " + pmName + " | User: " + userName + "\n")
            f.close()

        return json.dumps(dict(pid = pidOK, pmName = pmOK, userName = userOK))

    @cherrypy.expose
    def master_authenticate(self, password):
        passwordOK = False
        if password == 'MargaretThatcheris110%SEXY':
            passwordOK = True
            response_cookie = cherrypy.response.cookie
            response_cookie['session_id'] = cherrypy.lib.sessions.Session.generate_id(self)
            response_cookie['session_id']['path'] = '/'
            response_cookie['session_id']['expires'] = 1800
            valid_sessions.append(response_cookie['session_id'].value)
            t = threading.Timer(1800, purge_session_id, [response_cookie['session_id'].value])
            t.start()
        return json.dumps(dict(password = passwordOK))

    @cherrypy.expose
    def upload(self, input_file, viz_type):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        all_data = bytearray()
        while True:
            data = input_file.file.read(8192)
            all_data += data
            if not data:
                break

        uploadedFile = os.path.abspath('user_data/uploadedFile.csv')
        newFile = open(uploadedFile, 'wb')
        newFile.write(all_data)
        newFile.close()

        if viz_type == 'chord':
            noHeaderFile = os.path.abspath('user_data/noHeaderFile.csv')
            r = open(uploadedFile, "r")
            w = open(noHeaderFile, "w", newline='')
            reader = csv.reader(r)
            writer = csv.writer(w)
            for i in range(6): next(reader)
            for line in reader:
                writer.writerow(line)
            r.close()
            w.close()

            raise cherrypy.HTTPRedirect('/showChord')

        elif viz_type == 'sunburst':
            noHeaderFile = os.path.abspath('user_data/noHeaderFile.csv')
            r = open(uploadedFile, "r")
            w = open(noHeaderFile, "w", newline='')
            reader = csv.reader(r)
            writer = csv.writer(w)
            for i in range(7): next(reader)
            pathToConversion = {}
            for row in reader:
                if row:
                    path = row[0]
                    conversion = row[1]
                    pathToConversion[path] = conversion

            for key in sorted(pathToConversion, key=len, reverse=True):
                if key != "":
                    writer.writerow([key, pathToConversion[key]])
            r.close()
            w.close()

            raise cherrypy.HTTPRedirect('/showSunburst')

        elif viz_type == 'calendar':
            noHeaderFile = os.path.abspath('user_data/headerFile.csv')
            r = open(uploadedFile, "r")
            w = open(noHeaderFile, "w", newline='')
            reader = csv.reader(r)
            writer = csv.writer(w)
            writer.writerow(['Day', 'Cost'])

            line1 = next(reader)
            if not (any(c.isalpha() for c in line1)):
                writer.writerow(line1)

            for line in reader:
                writer.writerow(line)
            r.close()
            w.close()

            raise cherrypy.HTTPRedirect('/showCalendar')

        elif viz_type == 'linkscape':
            raise cherrypy.HTTPRedirect('/showLinkscape')

        elif viz_type == 'algorithms':
            raise cherrypy.HTTPRedirect('/showAlgorithms')


    @cherrypy.expose
    def showChord(self):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        return open(os.path.abspath('html/chord.html'))

    @cherrypy.expose
    def showSunburst(self):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        return open(os.path.abspath('html/sunburst.html'))

    @cherrypy.expose
    def showCalendar(self):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        return open(os.path.abspath('html/calendar.html'))

    @cherrypy.expose
    def showLinkscape(self):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        return open(os.path.abspath('html/linkscape.html'))

    @cherrypy.expose
    def showAlgorithms(self):
        # Checking to see if the cookie is still there
        request_cookie = cherrypy.request.cookie
        if (not request_cookie.keys()) or (request_cookie['session_id'].value not in valid_sessions):
            raise cherrypy.HTTPRedirect('/index')

        return open(os.path.abspath('html/algorithms.html'))

    @cherrypy.expose
    def download(self, filepath):
        return serve_file(os.path.abspath('sample_data') + '/' + filepath, "application/x-download", "attachment")

if __name__ == '__main__':

    config = {
        '/':
            {
                'tools.staticdir.on' : True,
                'tools.staticdir.root' : os.path.abspath(os.curdir),
                'tools.staticdir.dir' : ''
            },
        '/html':
            {
                'tools.staticdir.on' : True,
                'tools.staticdir.dir' : 'html'
            },
        '/js':
            {
                'tools.staticdir.on' : True,
                'tools.staticdir.dir' : 'js'
            },
        '/css':
            {
                'tools.staticdir.on' : True,
                'tools.staticdir.dir' : 'css'
            },
        '/favicon.ico':
            {
                'tools.staticfile.on': True,
                'tools.staticfile.filename': '/images/favicon.ico'
            },
        'global':
            {
                'server.socket_host' : '0.0.0.0'
            }
    }
    cherrypy.quickstart(GraphingServer(), '/', config)
