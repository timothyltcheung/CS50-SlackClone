import os
import collections
import datetime

from flask import Flask, request, render_template, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

messageMax = 100
channels = {}

@app.route("/")
def index():
    return render_template('home.html', channels=channels)

@app.route("/channel_list", methods=["GET"])
def channelList():
    return jsonify(channels)

@socketio.on('new channel')
def addNewChannel(newchannel):
    newchannelname = newchannel['new_channel']
    channels[newchannelname] = []
    emit('update channel list', {"new_channel": newchannelname}, broadcast=True)

@socketio.on('new message')
def addNewMessage(newMessage):
    fullMessage = {"user": newMessage['user'], "timestamp": str(datetime.datetime.now().strftime("%x %X")), "message": newMessage['new_message']}
    if len(channels[newMessage['channel']]) >= messageMax:
        channels[newMessage['channel']].append(fullMessage)
        channels[newMessage['channel']].pop(0);
    else:
        channels[newMessage['channel']].append(fullMessage)
    emit('update messages', {"channel": newMessage['channel'],"new_message":fullMessage}, broadcast=True)
    #use time library and make each message a dictionaray of user, time, message
