# activemq_js_consumer

## Demo on youTube

https://www.youtube.com/watch?v=A9-4aZdlzEE

## How to Run?

from command line, use the following command:

	mvn clean tomcat7:run -Dohadr.project.port=8093

Note that 'ohadr.project.port' is a property that lets you set the port that the application will be listening to. If none is set, the default port is 8080. You can use a different port that 8093, of course.

## Debug within Eclipse

See how in this README: https://gitlab.com/OhadR/activemq-spring-sandbox#debug-within-eclipse

## How Apache's example works?

See [Apache-ActiveMQ/ajax](#references) page for info. you can also see [here](#how-it-works)


class `MessageListenerServlet` (that `AjaxServlet` extends) implements the `doPost()` that receives all queries from amq.js. All client-side queries starts in amq.js' generic method `sendJmsMessage()` that invokes a POST to the back-end: `MessageListenerServlet.doPost()`. 

The `MessageListenerServlet` stores all `AjaxWebClient`s. The method `getAjaxWebClient()` puts the object onto the map, and the `ClientCleaner` removes the 'old' clients. Each `doPost()` calls the `getAjaxWebClient()`. Note that doPost() is called upon 'listen', 'unlisten', and 'send'. 

**Registering a Listener**

In case of a listener, amq.js#287, `addListener()` calls `sendJmsMessage()` with type=listen. The back-end does.... To Be Cont.

There is a problem with version greater than org.apache.activemq/activemq-web/5.9.0 (maybe even before), where the consumer was registered in ActiveMQ and working properly (receiveing messages), but after 1 minute it was deleted. After a long research, I understood that the `ClientCleaner` removes it, because every call from the JS comes from a different session. The `MLS` builds a key in a map that is built from the sessionId and the clientId (the default clientId is 'defaultAjaxWebClient'). Each object on the map registers also its last activity time, and if it is idle for 1 minute it is being revoked. Thus, if every call comes from a different session, all entries in the map are about to be deleted within 1 minute, and this is the reason why the consumer lived for only 1 minute.

I guess the reason is because incompatibility of Spring-web versions and the (old) code in this example's back-end. (for example, interface `org.eclipse.jetty.continuation.Continuation`, and the implementation of `Servlet3Continuation`, which is deprecated and incompatible with activeMQ new versions. Hence, I got exception upon Tomcat start:

    ClassCastException: org.eclipse.jetty.websocket.server.NativeWebSocketServletContainerInitializer cannot be cast to javax.servlet.ServletContainerInitializer  
    
When I have *downgraded* to version 5.3.1 (see pom) - it worked without the exception on Tomcat startup, and no errors on browser upon sending messages to backend.

## References

This is based on Apache's example: http://activemq.apache.org/ajax.html

in case the data will be removed, i paste the relevant info here:

## How it works

**AjaxServlet and MessageListenerServlet**

The ajax featues of amq are handled on the server side by the `AjaxServlet` which extends the `MessageListenerServlet`. This servlet is responsible for tracking the existing clients (using a HttpSesssion) and lazily creating the AMQ and javax.jms objects required by the client to send and receive messages (eg. Destination, MessageConsumer, MessageAVailableListener). This servlet should be mapped to `/amq/*` in the web application context serving the Ajax client (this can be changed, but the client javascript amq.uri field needs to be updated to match.)


**Client Sending messages**

When a message is sent from the client it is encoded as the content of a POST request, using the API of one of the supported connection adapters (jQuery, Prototype, or Dojo) for XmlHttpRequest. The amq object may combine several sendMessage calls into a single POST if it can do so without adding additional delays (see polling below).

When the `MessageListenerServlet` receives a POST, the messages are decoded as `application/x-www-form-urlencoded` parameters with their type (in this case send as opposed to `listen` or `unlisten` see below) and destination. If a destination channel or topic do not exist, it is created. The message is sent to the destination as a TextMessage.

**Listening for messages**

When a client registers a listener, a message subscription request is sent from the client to the server in a POST in the same way as a message, but with a type of `listen`. When the MessageListenerServlet receives a listen message, it lazily creates a MessageAvailableConsumer and registers a Listener on it.

**Waiting Poll for messages**

When a Listener created by the `MessageListenerServlet` is called to indicate that a message is available, due to the limitations of the HTTP client-server model, it is not possible to send that message directly to the ajax client. Instead the client must perform a special type of **Poll** for messages. Polling normally means periodically making a request to see if there are messages available and there is a trade off: either the poll frequency is high and excessive load is generated when the system is idle; or the frequency is low and the latency for detecting new messages is high.

To avoid the load vs latency tradeoff, AMQ uses a waiting poll mechanism. As soon as the amq.js script is loaded, the client begins polling the server for available messages. A poll request can be sent as a GET request or as a POST if there are other messages ready to be delivered from the client to the server. When the MessageListenerServlet receives a poll it:

if the poll request is a POST, all send, listen and unlisten messages are processed
if there are no messages available for the client on any of the subscribed channels or topic, the servlet suspends the request handling until:
A MessageAvailableConsumer Listener is called to indicate that a message is now available; or
A timeout expires (normally around 30 seconds, which is less than all common TCP/IP, proxy and browser timeouts).
A HTTP response is returned to the client containing all available messages encapsulated as text/xml.
When the amq.js javascipt receives the response to the poll, it processes all the messages by passing them to the registered handler functions. Once it has processed all the messages, it immediately sends another poll to the server.

Thus the idle state of the amq ajax feature is a poll request "parked" in the server, waiting for messages to be sent to the client. Periodically this "parked" request is refreshed by a timeout that prevents any TCP/IP, proxy or browser timeout closing the connection. The server is thus able to asynchronously send a message to the client by waking up the "parked" request and allowing the response to be sent.

The client is able to asynchronously send a message to the server by creating (or using an existing) second connection to the server. However, during the processing of the poll response, normal client message sending is suspended, so that all messages to be sent are queued and sent as a single POST with the poll that will be sent (with no delay) at the end of the processing. This ensures that only two connections are required between client and server (the normal for most browsers).

## Application Screenshot

![screenshot](/src/main/webapp/images/app-screenshot.JPG)
