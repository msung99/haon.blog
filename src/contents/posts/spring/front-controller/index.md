---
title: 서블릿 컨테이너의 프론트 컨트롤러 등장 배경, 공통 요청 처리방식
date: "2024-01-13"
tags:
  - 서블릿
  - 톰켓
previewImage: spring.png
---

## 서블릿 컨테이너

프론트 컨트롤러를 이해하기에 앞서, 서블릿 컨테이너에 대해 이해할 필요가 있다. 기존 90년대 전통적인 스프링 프레임워크가 존재했을 당시, 단순히 서블릿 컨테이너(ex. 톰캣) 내부에 서블릿들을 여러개 띄워놓기만 했었다. **특정 서블릿에 대해 URL 매핑 정보를 기입하면 해당 URL 로 들어온 요청을 그 서블릿이 처리하고, 클라이언트에게 응답하는 방식이었다.**

이런 방식만으로 불편함을 느껴 등장한 것이 스프링 컨테이너다. 서블릿 컨테이너 뒤에 똑같이 컴포넌트(Bean) 을 보유한 형태를 취한다. 클라이언트로부터 들어온 요청을 서블릿 컨테이너의 특정 컴포넌트(서블릿)이 받고, 그 요청을 스프링 컨테이너의 특정 빈에게 넘겨주는 방식이다.

### Containerless

`Servlet Containerless` 웹 아키텍처란, 서블릿 컨테이너가 없는 아키텍처 구조를 의미하는 것이 아니다. 서블릿 컨테이너를 필요로 하되, 이를 관리하고 신경쓰기 위해 개발자가 할애햐하는 불편함 및 수고를 제거하는 것이 Containerless 이다.

즉, 현재 스프링부트는 Containerless 가 적용한 구조를 취하고 있다. ** 서블릿 컨테이너가 실존하고 동작하지만, 이 서블릿 컨테이너를 설치하고 설정하는 등의 과정을 생략하고 곧 바로 스프링부트를 통해 서버를 띄울 수 있는 구조다.** 개발자는 서블릿 컨테이너에 대한 지식 없이도 Bean 컴포넌트에 대한 등록 방법만을 알고 스프링부트 애플리케이션 서버를 띄울 수 있다.

---

## 서블릿 컨테이너 띄우기

서블릿 컨테이너로 톰캣을 활용하곘다. 스프링부트의 도움없이 순수히 톰캣을 통해 컨테이너를 띄우겠다는 것이다.

우선 톰켓은 자바로 만들어진 웹서버 프로그램이다. 자바의 라이브러리 차원에서 내장형 톰캣을 제공해주는데, `Tomcat` 과 `TomcatServletWebServerFactory` 등의 클래스를 활용하여 내장형 톰캣 객체를 생성 및 활용 가능하다. 스프링부트를 처음에 프로젝트를 만들면 이미 내장형 톰캣이 우리 라이브러리에 들어와있고, 지금껏 이를 우리는 편리하게 사용하고 있었던 것이다.

### Mapping

서블릿 컨테이너가 웹 클라이언트로부터 요청을 받으면 여러개의 서블릿중에 어떤 서블릿에게 이 요청을 맡기면 될까를 결정하는데, 이 결정하는 작업을 매핑이라고 한다.

매핑된 서블릿은 요청을 처리하고, 응답을 만들기 위해서 필요한 작업들을 수행후 작업을 종료한다. 그러면 컨테이너가 다시 클라이언트에게 응답을 해준다. 이를 구현한 간단한 코드는 아래와 같다. 이 전체 코드를 구간별로 나누어서 상세히 알아보자.

```java
public class HellobootApplication {
	public static void main(String[] args) {
    	TomcatServletWebServerFactory serverFactory = new TomcatServletWebServerFactory();
        WebServer webServer = serverFactory.getWebServer(servletContext -> {
			servletContext.addServlet("hello", new HttpServlet() {
				@Override
				protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
					String name = req.getParameter("name");

					resp.setStatus(HttpStatus.OK.value());
					resp.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);
					resp.getWriter().println("Hello " + name);
				}
			}).addMapping("/hello");
		});
        webServer.start();
}
```

### TomcatServletWebServerFactory

우선 톰캣 팩토리 클래스다. `TomcatServletWebServerFactory` 를 활용하여 `Tomcat` 이라는 내장형 톰캣을 생성해줄 수 있다. 쉽게말해, 이 클래스는 스프링부트의 내장형 톰캣을 쉽게 생성할 수 있게 도와주는 도우미 클래스다.

```java
TomcatServletWebServerFactory serverFactory = new TomcatServletWebServerFactory();
```

### WebServer

다음은 WebSerber 이다. 이는 톰캣외에 Jetty 와 같은 여러 서블릿 컨테이너를 추상화 해놓은 것이다. 즉, WebServer 란 인터페이스로써 웹서버 타입을 추상화 해놓은 것으로, Tomac 과 Jetty 등의 다양한 웹서버 클래스 구현체를 수용할 수 있다.

```java
WebServer webServer = serverFactory.getWebServer();
```

### ServletContext

WebServer 내부에는 파라미터로 `ServletContextInitalizer` 타입의 구현 객체를 할당하면 된다. 이 생성된 객체를 통해 내부에 서블릿을 하나 생성해 볼 것이며, 해당 서블릿에 대해 매핑하는 과정도 거쳐볼 것이다.

`ServletContextInitalizer` 는 인터페이스로, 인터페이스이기 떄문에 이를 구현한 클래스를 오브젝트로 할당해도 좋다. 하지만 이 서블릿을 어디선가 또 여러번 이용할 것은 아니므로 익명 클래스로 간단히 객체를 생성해준다.

```java
WebServer webServer = serverFactory.getWebServer(servletContext -> {
	servletContext.addServlet("hello", new HttpServlet() { // 파라미터1 : 서블릿 이름 / 파라미터2 : 서블릿 정보 or 서블릿 타입의 오브젝트 => HttpServlet : 인터페이스 타입인 Servlet 의 구현체

```

서블릿을 생성하는 것은 `servletContext.addServlet()` 을 통해 생성한다. 이 메소드는 첫번째 파라미터로 생성할 서블릿의 이름, 두번쨰 파라미터로 `HttpServlet` 객체를 할당받는다. `HttpServlet` 란 인터페이스 타입의 Servlet 의 구현체다. 즉, 우리는 Servlet 인터페이스의 구현체로 HttpServlet 타입의 객체를 생성했고, 이 객체에서 Servlet 의 여러 메소드들 중에 `service` 라는 메소드를 오버라이딩 할 것이다.

### Serivce 오버라이딩

Servlet 인터페이스의 `service()` 를 오버라이딩 했다. 이 안에서 요청과 응답을 어떻게 수용하고 처리할 것인지를 정의해주면 된다.이는 `HttpServletRequest`, `HttpServletResponse` 인자를 통해 가능하다.

`HttpServletRequest` 란 요청을 가져오는 오브젝트, `HttpServletResponse` 란 응답을 만들어내는 오브젝트다. `setStatus()` 로 200 코드를 리턴해줌을 지정하고, `setHeader()` 로 HTTP 응답 헤더의 `Content-Type` 이라는 Key 값에 대한 Value 로 `text/plain` 을 지정해줬다. 응답 헤더의 "Content-Type: text-plain" 을 지정해주면 평범한 문자열을 리턴함을 의미하게 된다.

`getWriter()` 를 통해 응답의 Body 부분을 구상할 수 있다. 이 안에는 "Hello + ~" 가 바디에 실리게 된다. 마지막으로 `addMapping()` 을 통해 현재 생성한 서블릿이 어떤 URL 에 매핑될 것인지를 지정해줬다.

```java
WebServer webServer = serverFactory.getWebServer(servletContext -> {
	servletContext.addServlet("hello", new HttpServlet() {
	@Override
	protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String name = req.getParameter("name");

		resp.setStatus(HttpStatus.OK.value());
		resp.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE); // 헤더의 이름(name) 과 값(value) 를 할당. 평범한 문자열을 리턴
		resp.getWriter().println("Hello " + name);
	}
}).addMapping("/hello");
```

### 톰캣 구동

웹서버의 `start()` 를 호출하면 서블릿 컨테이너를 시작(구동) 할 수 있다.

```java
webServer.start();

```

---

## 프론트 컨트롤러(Front Controller)

다음으로 이번의 핵심인 프론트 컨트롤러를 구현해 볼 것이다. 프론트 컨트롤러가 무엇인지 알기전에, 기존 서블릿 처리방식에 대해 다시 되짚어보겠다.

### 중복되는 서블릿 코드

기존 서블릿은 각 요청마다 직접 다 하나씩 매핑해줘야하는 번거러움이 있었다. 가령 앞서 살펴봤던 "/hello" 는 이를 담당하는 서블릿을 따로 만들어서 처리를 했다.\*즉, 각 서블릿들에 대해 다른 URL 을 각각 매핑하는 방식으로 단순하게 구성했다.

하지만 이 방식은 "중복되는 코드" 로 부터 단점을 보이게 된다. 생성한 여러 서블릿에서 필요로 하는 공통적인 작업이 각 서블릿 코드안에 중복되서 등장할 수 있다. 여기서 "공통적인 작업" 이란, 인증이나 보안, 다국어처리 등과 같이 모든 웹 요청에 대해서 공통적으로 리턴해줘야 하는 작업 내용일 것이다.

### 프론트 컨트롤러 도입

중복되는 공통 작업 코드를 해결하고자 등장한 것이 프론트 컨트롤러다. 프론트 컨트롤러란, **모든 서블릿에 공통적으로 등장하는 작업 코드를 중앙화시키는 것으로, 중앙화된 가장 앞단에 (프론트 컨트롤러에) 배치하고 이 서블릿이 공통적인 작업을 처리하는 방식**이다.

---

## 프론트 컨트롤러 구현

기존 코드를 응용하여 프론트 컨트롤러를 구현해보자. 전체 코드는 아래와 같다.

```java
public class HellobootApplication {
	public static void main(String[] args) {
		TomcatServletWebServerFactory serverFactory = new TomcatServletWebServerFactory();
		HelloController helloController = new HelloController();

		WebServer webServer = serverFactory.getWebServer(servletContext -> {
			servletContext.addServlet("hello", new HttpServlet() {
				@Override
				protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
					// 인증, 보안, 다국어등의 공통 처리 코드 부분 (생략함)
					if(req.getRequestURI().equals("/hello")) {
						String name = req.getParameter("name");

						String ret = helloController.hello(name);

						resp.setStatus(HttpStatus.OK.value());
						resp.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);
						resp.getWriter().println(ret);
					}
					else if(req.getRequestURI().equals("/user")) {
						resp.setStatus(HttpStatus.NOT_FOUND.value());
					}
					else {
						resp.setStatus(HttpStatus.NOT_FOUND.value());
					}
				}
			}).addMapping("/*");
		});

		/
		webServer.start();
	}
}
```

### HelloController 생성

우선 HelloController 라는 컨트롤러를 생성해줬다. 이 컨트롤러는 특정 서블릿으로 들어온 요청에 대한 복집한 비즈니스 로직을 서블릿 코드 내에서 구현하는 대신에, 이 컨트롤러가 대신하여 처리해준다. 즉, 복잡한 비즈니스 로직을 서블릿이 아닌 HelloController 에 분리 시켜놓은 것이다. 복잡한 로직이 서블릿 코드 내에 모두 담기면 코드가 난잡하고 가독성이 저하됨을 감안한 것이다.

```java
HelloController helloController = new HelloController();
```

### 공통 처리 코드

여기서는 생략했지만, 인증 보안 다국어지원 등의 여러 서블릿들에 대한 공통 처리 코드를 구현한다. 그 후 매핑 URL 에 알맞는 특정 서블릿을 호출하는 방식이다.

```java
@Override
protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
	// 인증, 보안, 다국어등의 공통 처리 코드 부분 (생략함)
    f(req.getRequestURI().equals("/hello")) {
    	// ...
```

### /hello 매핑

"/hello" 라는 URL 에 매핑된 서블릿에 대해 처리하는 코드다. 요청으로 전달받은 파라미터 name 을 helloController 에게 넘겨준다. 그러면 helloController 는 복잡한 로직을 수행 후 결과값을 리턴하여 ret 변수에 넘겨줄 것이다. 앞서 말했듯이, 복잡한 로직을 HelloController 가 처리하도록 위임한 것이다.

```java
if(req.getRequestURI().equals("/hello")) {
	String name = req.getParameter("name");

	String ret = helloController.hello(name);

	resp.setStatus(HttpStatus.OK.value());
	resp.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);
	resp.getWriter().println(ret);
}
```

### NOT FOUND 처리

"/hello", "/user" 와 매핑되는 것이 없다면 NOT FOUND 를 리턴해준다.

```java
else {
	resp.setStatus(HttpStatus.NOT_FOUND.value());
}
```

### 중앙화 처리

마지막으로 중앙화된 처리를 위해 모든 요청을 다 받아야한다. 따라서 매핑시 이렇게 별표를 활용하여, 슬래시 "/" 밑으로 들어오는 모든 요청을 이 서블릿이 다 처리하겠다 라며 서블릿 컨테이너가 등록하는 것이다.

```java
}).addMapping("/*");
```

---

## 마치며

다음엔 스프링부트를 활용하여 DI, 스프링 컨테이너에 대해 더욱이 깊게 다루어보겠다.

---

## 더 학습해볼 키워드

- DispatcherServlet
- Jetty
- PropertySourcesPlaceholderConfigurer
