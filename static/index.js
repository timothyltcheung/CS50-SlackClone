// Using localStorage to set a display name
document.addEventListener('DOMContentLoaded', function() {
   if(!localStorage.getItem('displayName')) {
    var username = prompt('Enter Display Name',"Enter Display Name Here");
    localStorage.setItem('displayName', username);
  }
  document.querySelector('#displayName').innerHTML = "Display Name = " + localStorage.getItem('displayName');
});

function updateScroll(){
    var element = document.getElementById("messagebox");
    element.scrollTop = element.scrollHeight;
    return false;
};

// Access global variable to load updated channel list
document.addEventListener('DOMContentLoaded', function () {
  const request = new XMLHttpRequest();
  request.open("GET", "/channel_list");
  request.send();
  request.onload = () => {
    var data = JSON.parse(request.responseText);
    Object.keys(data).forEach(function(channel) {
      var new_li = document.createElement('li');
      new_li.innerHTML = '<pre><a href="javascript:void(0);">' + channel + '</a> </pre>';
      new_li.setAttribute("onClick", "changeChannel('" + encodeURIComponent(channel) + "');");
      new_li.className = "list-group-item";
      new_li.id = channel;
      document.querySelector('#channel_list').append(new_li);
    });
    // Need to put this function inside request because of async
    if(localStorage.getItem('lastchannel')) {
      changeChannel(localStorage.getItem('lastchannel'));
    }
  };
});

function changeChannel(channel) {
  channel = decodeURIComponent(channel)
  document.querySelector('#messages').innerHTML = '';
  listelements=document.querySelectorAll('.list-group-item');
  listelements.forEach(function(listelement) {
    listelement.style.backgroundColor = "white";
  });
  document.getElementById(channel).style.backgroundColor = "lightblue";
  const request = new XMLHttpRequest();
  request.open("GET", "/channel_list");
  request.send();
  request.onload = () => {
    var data = JSON.parse(request.responseText);
    data[channel].forEach(function(message) {
      var new_li = document.createElement('li');
      new_li.innerHTML = "<pre>"+ message["timestamp"]+' '+message["user"]+': '+message["message"]+"</pre>";
      document.querySelector('#messages').append(new_li);
    });
    updateScroll();
  };
  document.querySelector("#newmessage_form").style.visibility = "visible";
  localStorage.setItem('lastchannel', channel);
  return false;
};

var socket = io.connect();

// Adding a new channel
document.addEventListener('DOMContentLoaded', function() {
  // Submit button disabled on default
  document.querySelector('#newchannel_submit').disabled = true;
  // Enable button if there is text in the input field
  document.querySelector('#newchannel_name').onkeyup = () => {
    if (document.querySelector('#newchannel_name').value.length > 0)
      document.querySelector('#newchannel_submit').disabled = false;
    else {
      document.querySelector('#newchannel_submit').disabled = true;
    };
  };
  document.querySelector('#newchannel_form').onsubmit = function() {

    //AJAX request to get list of all Channels
    var new_channel = document.querySelector('#newchannel_name').value;
    var request = new XMLHttpRequest();
    request.open("GET", "/channel_list");
    request.send()
    request.onload = () => {
      var data = JSON.parse(request.responseText);
      if (!Object.keys(data).includes(new_channel)) {
        // update Flask global channel list variable using websocket
          socket.emit('new channel', {'new_channel': new_channel});
      }
      else {
      alert('Channel already exists');
      }
    };
    document.querySelector('#newchannel_name').value = '';
    return false;
  };
});

// update side bar of channels when a new channel is added
socket.on('update channel list', newchannelname => {
  var new_li = document.createElement('li');
  new_li.innerHTML = '<pre> <a href="javascript:void(0);">' + `${newchannelname.new_channel}` + '</a></pre>';
  new_li.setAttribute("onClick", "changeChannel('" + encodeURIComponent(`${newchannelname.new_channel}`) + "');");
  new_li.className = "list-group-item";
  new_li.id = `${newchannelname.new_channel}`;
  document.querySelector('#channel_list').append(new_li);
});

// Adding a new message
document.addEventListener('DOMContentLoaded', function() {
  // Submit button disabled on default
  document.querySelector('#newmessage_submit').disabled = true;
  // Enable button if there is text in the input field
  document.querySelector('#newmessage').onkeyup = () => {
    if (document.querySelector('#newmessage').value.length > 0 )
      document.querySelector('#newmessage_submit').disabled = false;
    else {
      document.querySelector('#newmessage_submit').disabled = true;
    };
  };
  document.querySelector('#newmessage_form').onsubmit = function() {
    var new_message = document.querySelector('#newmessage').value;
    document.querySelector('#newmessage').value = '';
    socket.emit('new message',{'new_message': new_message, "channel": localStorage.getItem('lastchannel'),
    "user": localStorage.getItem('displayName')});
    return false;
  };
});

// update channel messages when a new message is entered
socket.on('update messages', newmessage => {
  if (`${newmessage.channel}` == localStorage.getItem('lastchannel')) {
        var new_li = document.createElement('li');
        new_li.innerHTML = '<pre>' + `${newmessage.new_message.timestamp} ${newmessage.new_message.user}: ${newmessage.new_message.message}` + '</pre>';
        document.querySelector('#messages').append(new_li);
    }
  updateScroll();
  return false;
});
