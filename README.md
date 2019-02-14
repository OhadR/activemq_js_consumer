# activemq_js_consumer

## How to Run?

from command line, use the following command:

	mvn clean tomcat7:run -Dohadr.project.port=8093

Note that 'ohadr.project.port' is a property that lets you set the port that the application will be listening to. If none is set, the default port is 8080. You can use a different port that 8093, of course.

## Debug within Eclipse

See how in this README: https://gitlab.com/OhadR/activemq-spring-sandbox#debug-within-eclipse

## How Apache's example works?

class `MessageListenerServlet` (that `AjaxServlet` extends) implements the `doPost()` that receives all queries from amq.js. All client-side queries starts in amq.js' generic method `sendJmsMessage()` that invokes a POST to the back-end: `MessageListenerServlet.doPost()`. 

**Registering a Listener**

In case of a listener, amq.js#287, `addListener()` calls `sendJmsMessage()` with type=listen. The back-end does.... To Be Cont.