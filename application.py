import os
import datetime

from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Maximum number of messages to store in Flask server memory per channel
MESSAGE_MAX = 100
# Dictionary that will store the channel name as the key and a
# list of messages as the value
channels = {}


@app.route("/")
def index():
    return render_template('home.html', channels=channels)


@app.route("/channel_list", methods=["GET"])
def channelList():
    return jsonify(channels)


@socketio.on('new channel')
def addNewChannel(newchannel):
    # Assign name of new channel to newchannelname
    newchannelname = newchannel['new_channel']
    # Initialize an empty list to store messages in channels dictionary with
    # new channel as key
    channels[newchannelname] = []
    emit('update channel list', {"new_channel": newchannelname}, broadcast=True)


@socketio.on('new message')
def addNewMessage(newMessage):
    # Construct the full message with username, timestamp, and message
    fullMessage = {"user": newMessage['user'], "timestamp": str(datetime.datetime.now().strftime("%x %X")), "message": newMessage['new_message']}
    # Check if maximum number of messages stored has been reached
    if len(channels[newMessage['channel']]) >= MESSAGE_MAX:
        # If max reached, append message to end of list and discard first element
        channels[newMessage['channel']].append(fullMessage)
        channels[newMessage['channel']].pop(0)
    else:
        # Else if max not reached, append message to list
        channels[newMessage['channel']].append(fullMessage)
    emit('update messages', {"channel": newMessage['channel'], "new_message": fullMessage}, broadcast=True)
