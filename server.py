import cherrypy
import csv
import os

class GraphingServer(object):
    @cherrypy.expose
    def index(self):
        response = """
            <!DOCTYPE html>
            <meta charset="utf-8">
            <html>
                <head>
                    <style>
                        body {
                          font-size: 12px;
                          font-family: "Helvetica Neue", Helvetica;
                        }
                    </style>
                    <title>D3 Visualization Generator</title>
                </head>

                <body>
                    <form action="upload" method="post" enctype="multipart/form-data">
                        Select CSV to upload:
                        <input type="file" name="input_file"></input>
                        <select name="viz_type">
                            <option value="chord">Chord Diagram</option>
                            <option value="sunburst">Sequences Sunburst</option>
                            <option value="calendar">Calendar View</option>
                            <option value="linkscape">LinkScape</option>
                        </select>
                        <input type="submit" value="Submit"></input>
                    </form>
                </body>
            </html>
        """
        return response

    @cherrypy.expose
    def upload(self, input_file, viz_type):

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


    @cherrypy.expose
    def showChord(self):
        return open(os.path.abspath('html/chord.html'))

    @cherrypy.expose
    def showSunburst(self):
        return open(os.path.abspath('html/sunburst.html'))

    @cherrypy.expose
    def showCalendar(self):
        return open(os.path.abspath('html/calendar.html'))

    @cherrypy.expose
    def showLinkscape(self):
        return open(os.path.abspath('html/linkscape.html'))


if __name__ == '__main__':

    config = {'/':
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
        'global':
            {
                'server.socket_host' : '0.0.0.0'
            }
    }
    cherrypy.quickstart(GraphingServer(), '/', config)
