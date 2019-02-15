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

class `MessageListenerServlet` (that `AjaxServlet` extends) implements the `doPost()` that receives all queries from amq.js. All client-side queries starts in amq.js' generic method `sendJmsMessage()` that invokes a POST to the back-end: `MessageListenerServlet.doPost()`. 

The `MessageListenerServlet` stores all `AjaxWebClient`s. The method `getAjaxWebClient()` puts the object onto the map, and the `ClientCleaner` removes the 'old' clients. Each `doPost()` calls the `getAjaxWebClient()`. Note that doPost() is called upon 'listen', 'unlisten', and 'send'. 

**Registering a Listener**

In case of a listener, amq.js#287, `addListener()` calls `sendJmsMessage()` with type=listen. The back-end does.... To Be Cont.

There is a problem with version greater than org.apache.activemq/activemq-web/5.9.0 (maybe even before), where the consumer was registered in ActiveMQ and working properly (receiveing messages), but after 1 minute it was deleted. After a long research, I understood that the `ClientCleaner` removes it, because every call from the JS comes from a different session. The `MLS` builds a key in a map that is built from the sessionId and the clientId (the default clientId is 'defaultAjaxWebClient'). Each object on the map registers also its last activity time, and if it is idle for 1 minute it is being revoked. Thus, if every call comes from a different session, all entries in the map are about to be deleted within 1 minute, and this is the reason why the consumer lived for only 1 minute.

I guess the reason is because incompatibility of Spring-web versions and the (old) code in this example's back-end. (for example, interface `org.eclipse.jetty.continuation.Continuation`, and the implementation of `Servlet3Continuation`, which is deprecated and incompatible with activeMQ new versions. Hence, I got exception upon Tomcat start:

    ClassCastException: org.eclipse.jetty.websocket.server.NativeWebSocketServletContainerInitializer cannot be cast to javax.servlet.ServletContainerInitializer  
    
When I have *downgraded* to version 5.3.1 (see pom) - it worked without the exception on Tomcat startup, and no errors on browser upon sending messages to backend.