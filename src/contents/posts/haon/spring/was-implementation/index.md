---
title: HTTP 웹 서버를 직접 구현하여 프로토콜 스펙을 이해해보자!
date: "2024-10-19"
tags:
  - HTTP
  - WAS
previewImage: spring.png
series: HTTP 웹서버 Spring MVC 프레임워크 구현하기
---

## 학습 배경

[HTTP 웹 서버 직접 구현하기 미션](https://github.com/Durable-developers/Next-Step-HTTP-Web-Server-Implementation.git) 을 진행하면서 많은 시간을 할애했다. 고민했던 과정들이 정말 많았기에 재밌는 실습을 진행할 수 있었다 🙂 이번에 구현에 대한 내용과 과정들을 자세히 다루어보고자 한다.

요구사항에 대한 상세한 설명은 생략한다. 어떻게 요구사항을 준수하면서 HTTP 웹 서버를 구현했는지에 대해 중점으로 다루어 보고자 한다. 또 요구사항을 해결해가는 과정에서 HTTP 프로토콜 스펙 및 쿠키등 여러 지식에 대한 이론을 다루겠다.

---

## 웹서버를 구현할 메인 클래스 역할

HTTP 웹서버를 구현하기 위해, 2가지 클래스를 중점으로 구현해 나가도록 하겠다. 각 요구사항을 해결해나가는 과정속에서 HTTP 프로토콜에 대해 다루도록 한다.

### WebServer

`WebServer` 클래스는 웹 서버를 시작하고, 클라이언트의 요청이 있을 때 까지 대기 상태에 있다가, **요청이 들어올 경우 해당 요청을 RequestHandler 클래스에게 위임하는 역할을 한다.**

사용자 요청이 발생할 때 까지 대기 상태에 있도록 지원하는 역할은 자바의 `ServerSocket` 클래스가 담당한다. ServerSocket 에 클라이언트 요청이 들어오는 순간, 클라이언트와 연결을 담당하는 Socket 을 RequestHandler 에 전달하면서 새로운 쓰레드를 실행하는 방식으로 멀티쓰레드 프로그래밍을 지원하고 있다.

```java
public class WebServer {
    private static final Logger log = LoggerFactory.getLogger(WebServer.class);
    private static final int DEFAULT_PORT = 8080;

    public static void main(String args[]) throws Exception {
        int port = 0;
        if (args == null || args.length == 0) {
            port = DEFAULT_PORT;
        } else {
            port = Integer.parseInt(args[0]);
        }

        // 서버소켓을 생성한다. 웹서버는 기본적으로 8080번 포트를 사용한다.
        try (ServerSocket listenSocket = new ServerSocket(port)) {
            log.info("Web Application Server started {} port.", port);

            Socket connection; // Socket: 클라이언트와의 연결을 담당. 클라이언트가 연결될 때 까지 (요청이 들어올 때 까지) 대기한다.
            while ((connection = listenSocket.accept())  != null) {
            	// 요청이 들어오면 해당 요청을, 즉 Socket을 RequestHandler 에 전달하면서 요청에 대한 처리를 위임한다.
                RequestHandler requestHandler = new RequestHandler(connection);
                requestHandler.start(); // 요청 처리 시작
            }
        }
    }
}
```

### RequestHandler

RequestHandler 클래스는 앞서 말했듯이 `WebServer` 클래스로 부터 전달받은 Socket 을 전달받고 클라이언트의 요청을 처리한다. 정확히는 이 클래스 내부의 `run()` 메소드에서 클라이언트 요청 처리 코드를 구현할 것이다.

`InputStream` 은 클라이언트(웹 브라우저) 에서 서버로 요청을 보낼 때 전달되는 데이터를 담당하는 스트림이다. 반면 `OutputStream` 은 반대로 서버에서 클라이언트에 응답을 보낼 때 전달하는 데이터를 담당하는 스트림이다.

```java
public class RequestHandler extends Thread {
    private static final Logger log = LoggerFactory.getLogger(RequestHandler.class);
    DataBase dataBase = new DataBase();

    private Socket connection;

    public RequestHandler(Socket connectionSocket) {
        this.connection = connectionSocket;
    }

    public void run() {
        log.debug("New Client Connect! Connected IP : {}, Port : {}", connection.getInetAddress(),
                connection.getPort());

        try (InputStream in = connection.getInputStream();
			 OutputStream out = connection.getOutputStream()) {

         	// TODO: 사용자 요청에 대한 처리는 여기서 구현된다.

         } catch(IOException e) {
			log.error(e.getMessage());
         }
    }

    private void response200Header(DataOutputStream dos, int lengthOfBodyContent) {
    	try {
            dos.writeBytes("HTTP/1.1 200 OK \r\n");
            dos.writeBytes("Content-Type: text/html;charset=utf-8\r\n");
            dos.writeBytes("Content-Length: " + lengthOfBodyContent + "\r\n");
            dos.writeBytes("\r\n");
        } catch (IOException e) {
            log.error(e.getMessage());
        }
    }
}
```

정리하자면, WebServer 는 클라이언트(웹 브라우저) 의 요청을 언제든지 받을 수 있도록 Socket 을 생성해두고 대기 상태에 있는다. 그러다 요청이 들어오면, 해당 요청을 RequestHandler 에게 처리하도록 떠넘기는 방식이다. 처리가 완료 되었다면, RequestHandler 는 응답을 WebServer 에게 보낸다.

---

## HTTP 프로토콜 스펙

요구사항을 해결하기 위해 HTTP 의 표준 스펙에 대해 이해해야한다. 웹 클라이언트는 웹 서버와 데이터를 주고받기 위해 HTTP 라는 서로간의 약속된 규약을 따른다. 웹 클라이언트가 웹 서버에 요청을 전송하기 위한 규약을 이해하기 위해, 아래 스펙을 예를 들어보곘다.

### 요청(Request) 메시지 규약

```c
POST /user/create HTTP/1.1  // (1) 요청 라인(Request Line)
HOST: localhost:8080  // (2) 요청 헤더(Request Header)
Connection-Length: 59
Content-Type: application/x-wwww-form-unlencoded
Accept: */*

userId=msung99&password=password  // (3) 요청 본문(Request Body)
```

#### (1) 요청 라인(Request Line)

`(1)` 에 해당하는 내용이다. 요청 데이터의 첫번째 라인은 요청 라인(Request Line) 이라고 부른다. 요청 라인은 `HTTP-메소드 URI HTTP-버전` 의 형태로 구성된다. HTTP 메소드는 요청의 종류를 나타내며, HTTP 버전의 경우 현재 HTTP/1.1 을 기준으로 한다.

#### (2) 요청 헤더(Request Header)

`(2)` 에 해당하는 내용이다. 요청 헤더는 `<필드 이름> : <필드 값>` 형태의 key-value 쌍으로 구성된다.

#### (3) 요청 본문(Request Body)

`(3)` 에 해당하는 내용이다. 헤더와 본문 사이에 빈 공백 라인 1줄을 두고 본문이 주어진다.

### 응답(Response) 메시지 규약

```c
HTTP/1.1 200 OK  // (1) 상태 라인(Status Line)
Content-Type: text/html;charset=utf-8  // (2) 응답 헤더(Response Header)
Content-Length: 20

<h1>Hello World!</h1> // (3) 응답 본문(Response Body)
```

응답 메시지는 요청 메시지의 규약과 유사한 구조를 지닌다. 다만 다른점이라면 첫번째 라인 `(1)` 의 상태라인의 형식이 다르다는 것이다.

#### 상태라인(Status Line)

응답 헤더의 첫번째 라인은 상태 라인이라고 부른다. `HTTP-버전 상태코드 응답구문` 의 구조를 취하고 있다.

이렇게까지 HTTP 요청과 응답의 기본 구조(규약) 에 대해 살펴봤다.

---

## 요구사항1. index.html 을 응답한다.

> 요구사항 : http://localhost:8080/index.html 로 접속했을 때 webapp 디렉토리의 index.html 파일을 읽어 클라이언트에 응답한다.

### BasicCode

이를 만족시키기 위한 코드는 아래와 같이 구현했다.

```java
public void run() {
	log.debug("New Client Connect! Connected IP : {}, Port : {}", connection.getInetAddress(),
    	connection.getPort());

     try (InputStream in = connection.getInputStream(); OutputStream out = connection.getOutputStream()) {
          DataOutputStream dos = new DataOutputStream(out);
          BufferedReader br = new BufferedReader(
							    new InputStreamReader(in, "UTF-8"));//(1)
          String line = br.readLine(); // (2)
          log.debug("request line : {}", line);

           if(line == null) {
           		return;
           }

           String[] tokens = line.split(" "); //  (3)
           while(!line.equals("")) { // (4)
             	line = br.readLine();
                log.debug("header : {}", line);
           }

           byte[] body = Files.readAllBytes(
           			new File("./webapp" + tokens[1]).toPath()); // (5)
           response200Header(dos, body.length);
           responseBody(dos, body);
      } catch (IOException e) {
      		log.error(e.getMessage());
      }
}
```

#### BufferedReader 로 헤더 값 읽어오기

조금씩 뜯어보자. 우선 `(1)` 에서 `BufferdReader` 를 이용해 헤더 값을 읽는다.

#### 요청 라인(Request Line) 읽어오기

곧바로 바로 아래 라인 `(2)` 에서 BufferedReader 를 활용해 `요청 라인(Request Line)` 을 읽어오게 되는데, 이렇게 읽어온 헤더의 첫번째 줄에는 HTTP 메소드, 요청 URL, HTTP 버전이 공백을 사이에 두고 들어온다. (ex. GET /index.html HTTP/1.1)

#### 요청 라인을 split 하여 문자열 배열에 담기

`(3)` 에서는 요청 라인을 공백을 기준으로 자르는 모습을 볼 수 있다. 즉, tokens 라는 문자열 배열에 "GET", "/index.html", "HTTP/1.1" 에 담기게 될 것이다.

#### 헤더 정보 출력하기

`(4)` 에서는 반복문을 계속 순환하면서 헤더의 나머지 데이터를 모두 출력한다. "/index.html" 로 요청을 보냈을 때 헤더를 출력한 결과는 아래와 같다.

![](https://velog.velcdn.com/images/msung99/post/bc3cac76-1cc7-452d-bef1-23f9e0330ba8/image.png)

그런데 이때 분명 index.html 로 요청을 단 1번을 보냈을 뿐인데 1번의 요청이 아니라 여러번의 추가 요청이 발생하는 것을 확인할 수 있다. 이렇게 많은 요청이 발생한 이유는 서버가 웹 페이지를 구성하는 모든 리소스(html, css, js, 이미지 등) 을 한번에 응답으로 보내지 않기 때문이다.

**웹 서버는 첫번쨰로 /index.html 요청에 대한 응답에 HTML 만을 보낸다. 응답을 받은 브라우저는 HTML 내용을 분석하여 css, js , 이미지등의 자원이 포함되어 있다면 서버에 해당 자원을 다시 요청하게 된다.** 따라서 하나의 웹 페이지를 사용자에게 정상적으로 서비스하려면 클라이언트와 서버간의 1번의 요청이 아닌 여러번의 요청과 응답을 주고받게 된다.

#### Response Body 구성하기

마지막으로 `(5)` 에서는 URL 해당하는 파일을 가지고와서 byte array 로 변환 후 body에 넣어준다. 앞서 살펴봤듯이 tokens 배열에는 헤더의 `요청 라인(Request Line)` 이 공백을 기준으로 담기는데, 2번째 요소인 tokens[1] 에는 URL 이 담기게 된다.

---

## 요구사항2. GET 방식으로 회원가입한다.

이 요구사항을 요약하면 아래와 같다.

> - "회원가입" 메뉴를 클릭하면 /user/form.html 로 이동하면서 회원가입을 진행한다.

- 회원가입을 진행하면 다음과 같은 형태로 사용자가 입력한 값이 서버로 전달된다.
  "/user/create?userId=msung99&password=msung1234&name=minsung&email=msung99@gmail.com"
- HTML 과 URL 을 비교해보고 사용자가 입력한 값을 파싱하여 User 클래스에 저장한다.

run( ) 메소드를 아래와 같이 개선해줘야하는데, 이를 위해 /user/create 에서 회원가입 버튼을 클릭시 전송되는 URL 는 아래와 같은 형식으로 전송된다.

```java
http://localhost:8080/user/create?userId=msung99&password=msung1234&name=minsung&email=msung99@gmail.com
```

쿼리 스트링(QueryStrig) 으로, 즉 URL 에 파라미터로 회원가입시 form 에 입력한 유저의 정보가 실리는 것을 확인할 수 있다. 우리는 이 URL 을 통해 전달된 유저 데이터를 기반으로 서버의 DB 에다 유저 데이터를 저장하는 로직을 구현해야한다.

다시 말하자면, /user/create로 URL이 시작될때 URL의 뒷부분인 QueryString 값을 가져와서 parseQueryString 메소드를 이용해
각각의 값을 User 객체 생성자에 param값으로 넣어주는 로직을 구현하면 된다.

### GET - SignUp

물음표 "?" 이후에 유저 정보가 실리는 것을 볼 수 있는데, 이 URL 문자열을 파싱하여 입력된 유저 데이터를 추출하는 코드는 아래와 같이 구현했다.

```java
public void run() {
	log.debug("New Client Connect! Connected IP : {}, Port : {}", connection.getInetAddress(),
    connection.getPort());

     try (InputStream in = connection.getInputStream(); OutputStream out = connection.getOutputStream()) {
     	DataOutputStream dos = new DataOutputStream(out);
        BufferedReader br = new BufferedReader(new InputStreamReader(in, "UTF-8"));
        String line = br.readLine();
        log.debug("request line : {}", line);

        if(line == null) {
        	return;
        }

        String[] tokens = line.split(" ");

        while(!line.equals("")) {
        	line = br.readLine();
            log.debug("header : {}", line);
        }

        String url = tokens[1];
        if(url.startsWith("/user/create")) {
        	int index = url.indexOf("?");
            String queryString = url.substring(index + 1);

            Map<String, String> params = HttpRequestUtils.parseQueryString(queryString);
            String userId = params.get("userId");
            String password = params.get("password");
            String name = params.get("name");
            String email = params.get("email");
            User user = new User(userId, password, name, email);
            // TODO: 추후 DB 구현 필요
         } else {
             byte[] body = Files.readAllBytes(new File("./webapp" + tokens[1]).toPath());
             response200Header(dos, body.length);
             responseBody(dos, body);
         }
     } catch (IOException e) {
         log.error(e.getMessage());
     }
}
```

"/user/create" 로 요청이 들어올 경우 사용자가 입력한 값을 파싱하여 User 클래스에 저장하는 모습을 볼 수 있다. 추후 DB 가 구축됨에 따라 생성된 User 객체를 저장하는 로직을 구현할 예정이다.

---

## 요구사항3. POST 방식으로 회원가입한다.

> 요구사항 : /user/form.html 파일의 form 태그 메소드를 get 에서 post 로 수정한 후 회원가입 기능이 정상적으로 동작하도록 구현한다.

GET 방식으로 요청했던 회원가입 요청을 POST 로 변경해야한다. 때문에 /user/form.html 의 question form 태그의 method 를 get 에서 post 로 변경해주었다.

```html
<form name="question" method="post" action="/user/create"></form>
```

변경해줬다면, GET 방식으로 요청할 때 URL 에 포함되어 있던 쿼리 스트링이 없어지고 method 가 GET 에서 POST 로 변경되었다. 요청 URL 에 포함되어 있던 쿼리 스트링의 내용물은 HTTP 요청의 `Request Body(요청 본문)` 을 통해 대신 전달된다. 또한 POST 방식으로 데이터를 전달하면서 헤더에 본문 데이터에 대한 길이가 `Content-Length` 라는 필드 이름으로 전달된다.

### Post - SignUp

이를 고려한 구현 코드는 아래와 같이 개선해줬다.

```java
public void run() {
	log.debug("New Client Connect! Connected IP : {}, Port : {}", connection.getInetAddress(),
    connection.getPort());

     try (InputStream in = connection.getInputStream(); OutputStream out = connection.getOutputStream()) {
     	DataOutputStream dos = new DataOutputStream(out);
        BufferedReader br = new BufferedReader(new InputStreamReader(in, "UTF-8"));
        String line = br.readLine();
        log.debug("request line : {}", line);

        if(line == null) {
        	return;
        }

        String[] tokens = line.split(" ");
        int contentLength = 0; // (1)

        while(!line.equals("")) {
        	line = br.readLine();
            log.debug("header : {}", line);
            if(line.contains("Content-Length")) { // (2)
            	contentLength = getContentLength(line);
            }
        }

        String url = tokens[1];
        if(("/user/create".equals(url)) {
        	String body = IOUtils.readData(br, contentLength); // (3)

            // (4)
            Map<String, String> params = HttpRequestUtils.parseQueryString(body);
            String userId = params.get("userId");
            String password = params.get("password");
            String name = params.get("name");
            String email = params.get("email");
            User user = new User(userId, password, name, email);
            // TODO: 추후 DB 구현 필요
         } else {
             byte[] body = Files.readAllBytes(new File("./webapp" + tokens[1]).toPath());
             response200Header(dos, body.length);
             responseBody(dos, body);
         }
     } catch (IOException e) {
         log.error(e.getMessage());
     }
}
```

우선 요청 본문에 담을 데이터의 길이(크기) 를 저장할 변수를 `(1)` 에서 선언해줬다. 이후 `(2)` 에서 헤더의 여러 key 값중 `Content-Length` 에 대한 value 값, 즉 요청 본문의 길이값을 추출한다.

이렇게 구한 길이만큼 `(3)` 처럼 본문을 읽는다. 본문을 읽는 기능은 `IOUTils.readData()` 로 구현했다. 이후 본문 데이터를 `(4)` 처럼 Map<String, String> 형태로 변환하면 된다. 요구사항2 를 구현했을땐 유저 데이터를 URL 의 쿼리 스트링으로 전달 받았다면, 이젠 요청의 바디(Request Body) 로 부터 유저 데이터를 전달받는 방식이다.

추가적으로 `(2)` 에서 본문의 길이값을 추출할 때 getContentLength 라는 메소드를 활용한 것을 볼 수 있다. 이에대한 구현은 아래와 같이 진행해줬다. 헤더의 한 줄을 읽어왔을 때 "Content-Length: 80" 과 같은 형식으로 읽어올텐데, 이를 ":" 로 split 한 후 80에 해당하는 값을 Integer.parseInt() 로 형식을 변환하여 리턴하는 기능이다.

```java
private int getContentLength(String line) {
	String[] headerTokens = line.split(":");
    return Integer.parseInt(headerTokens[1].trim());
}
```

---

## 요구사항4. 302 Status Code 를 적용한다.

> 요구사항 : 회원가입을 완료하면 /index.html 페이지로 이동해야한다. 현재는 URL 이 /user/create 로 유지되는 상태로 읽어서 전달할 파일이 없다. 따라서 회원가입을 완료한 후 /index.html 페이지로 이동한다. 브라우저의 URL 도 /user/create 가 아니라 /index.html 로 변경해야 한다.

이를 구현하기 위해선, 선수지식으로 HTTP 의 상태코드 값을 이해하면 좋다. 이미 잘 알고있지만, 복습 겸 한번 되짚어보겠다.

> - 200번대 : 성공. 클라이언트가 요청한 동작을 수신하여 이해하고 승인했으며 성공적으로 처리했음을 의미한다.

- 300번대 : 리다이렉션. 클라이너트는 요청을 마치기 위해 추가 동작이 필요하다.
- 400번대 : 요청 오류. 클라이언트에 오류가 있다.
- 500번대 : 서버 오류. 서버가 유효한 요청을 명백하게 수행하지 못했다.

회원가입을 처리하는 "/user/create" 요청과 첫 화면 "/index.html" 을 보여주는 요청을 분리한 후 HTTP 의 302 상태 코드를 활용해야한다. 즉, 웹 서버는 "/user/create" 요청을 받아 회원가입을 완료한 후 응답을 보낼 때 클라이언트(웹 브라우저) 에게 "/index.html" 로 이동하도록 할 수 있다. 이때 사용하는 상태 코드가 `302` 이다. "/index.html" 로 이동하도록 응답을 보낼 때 사용하는 응답 헤더는 `Location` 으로 다음과 같이 응답을 보내면 된다.

```python
HTTP/1.1 302 Found
Location: /index.html
```

위 처럼 응답을 보내면 클라이언트는 첫 라인의 상태 코드를 확인 후 302라면 Location 값을 읽어서 서버에 재요청을 보내게 된다. 재 요청을 보내면 클라이언트의 요청은 회원가입 처리를 위한 "/user/create" 으로의 요청이 아니라 "/index.html" 으로의 요청으로 변경된다. 이 상태에서 URL 을 확인해보면 "/user/create" 가 아닌 "/index.html" 로 변경된 것을 확인할 수 있다.

### 302 를 적용한다.

구현 코드는 아래와 같다. 가장 눈여겨 볼 점은 `response302Header()` 라는 메소드를 생성해줬으며, 이를 호출한다는 점이다.

```java
String url = tokens[1];
if("/user/create".equals(url)) {
	String body = IOUtils.readData(br, contentLength);
    // ... (이전 구현 코드와 동일)
    response302Header(dos, "/index.html");
}
// ...
```

### response302Header

`response302Header()` 의 구현 코드는 아래와 같다. 앞서 말한 302 상태 코드를 적절히 리턴하고 있으며, 302 상태 코드값이 확인 되었을때 리다이렉션 될 URL 값(즉, "/index.html") 을 `Location` 에 할당해줬다.

```java
private void response302Header(DataOutputStream dos, String url) {
    try {
    	dos.writeBytes("HTTP/1.1 302 Found \r\n");
        dos.writeBytes("Location: " + url + "\r\n");
        dos.writeBytes("\r\n");
    } catch (IOException e) {
        log.error(e.getMessage());
	}
}
```

---

## 요구사항5. 로그인한다.

> - "로그인" 메뉴를 클릭하면 "/user/login.html" 로 이동해 로그인할 수 있다. 로그인이 성공하면 "/index.html" 로 이동하고, 로그인에 실패하면 "/user/login_failed.html" 로 이동해야 한다.

- 앞에서 회원가입한 사용자로 로그인될 수 이썽야한다. 로그인이 성공하면 로구인 상태를 유지할 수 있어야한다. 로그인이 성공할 경우 요청 헤더의 Cookie 값이 logined=true, 실패하면 logined=false 로 전달되어야 한다.

### 쿠키(Cookie) 의 등장배경

**HTTP 는 무상태 프로토콜이다.** 요청을 보내고 응답을 받으면 클라이언트와 서버간의 연결을 바로 끊는다. 연결을 끊기 때문에 각 요청 사이에 상태를 공유할 수가 없다.

무상태 프로토콜이므로, 서버는 클라이언트가 누구인지 식별할 수가 없다. 서버가 클라이언트를 식별할 수 없기 떄문에 앞에서 클라이언트가 한 행위를 기억할 수 없다. 가령 로그인을 완료한다고 한들, 매 요청마다 다시 로그인을 시도하지 않을 것이다.

### HTTP 의 쿠기 지원 플로우

이를 위해 등장한 것이 `쿠키(Cookie)` 이다. HTTP 가 쿠키를 지원하는 방법은 다음과 같다.

- `(1)` : 먼저 서버에서 로그인 요청을 받으면 로그인 성공/실패 여부에 따라 응답 헤더에 `Set-Cookie` 로 결과값을 저장할 수 있다.

- `(2)` : 클라이언트는 응답 헤더에 `Set-Cookie` 가 존재할 경우 `Set-Cookie` 의 값을 읽어 서버에 보내는 요청 헤더의 Cookie 헤더 값으로 다시 전송한다. **즉, 각 HTTP 요청간에 데이터를 공유할 방법이 없기 떄문에 헤더를 통해 공유할 데이터를 매번 다시 전송하는 방식으로 데이터를 공유한다.** 이때 공유할 데이터로 쿠키를 헤더에 넣을 수 있는 것이다.

### 쿠키(Cookie) 를 적용한다.

구현 코드는 아래와 같다.

```java
if("/user/create".equals(url)) {
    // ... (기존 로직과 동일)
    DataBase.addUser(user); // (1)
    response302Header(dos, "/index.html");
} else if("/user/login".equals(url)) {
	String body = IOUtils.readData(br, contentLength);

    Map<String, String> params = HttpRequestUtils.parseQueryString(body);
    User user = DataBase.findUserById(params.get("userId"));

    if(user == null) {
    	responseResource(out, "/user/login_failed.html");
        return;
    }

    if(user.getPassword().equals(params.get("password"))) {
    	response302LoginSuccess(dos);
    } else {
    	responseResource(out, "/user/login_failed.html");
	}
}
```

로그인 기능을 구현하기 위해선, 우선 회원가입 기능 및 데이터베이스에 유저 정보를 저장하는 기능이 원활히 구현되어야 할 것이다. 이를 위해 위의 `(1)` 처럼 DB 에 유저 데이터를 저장하는 플로우를 구현했다.

### response302LoginSuccess

```java
private void response302LoginSuccess(DataOutputStream dos) {
	try {
    	dos.writeBytes("HTTP/1.1 302 Found \r\n");
        dos.writeBytes("Set-Cookie: logined-true \r\n");
        dos.writeBytes("\r\n");
    } catch (IOException e) {
        log.error(e.getMessage());
    }
}
```

로그인이 성공하면 응답 헤더에 `Set-Cookie` 헤더의 값으로 `logined=true` 를 전달했다. 위와 같이 구현을 완료한 후 서버를 재시작하고 회원가입, 로그인 순으로 테스트를 진행한다.

### responseResource

```java
private void responseResource(OutputStream out, String url) throws IOException {
	DataOutputStream dos = new DataOutputStream(out);
    byte[] body = Files.readAllBytes(new File("./webapp" + url).toPath());
    response200Header(dos, body.length);
    responseBody(dos, body);
}
```

로그인이 실패할 경우 호출되는 메소드다.

이와 같이 모든 요청에 로그인 성공 유무에 대한 정보가 전달된다. `response302LoginSuccess()` 를 호출하여 서버는 응답 헤더에 `Set-Cookie` 에 대해 로그인 성공 여부를 전달한다. 이러한 `Set-Cookie` 필드가 포함된 HTTP 응답을 전달받은 클라이언트는, 이후 서버에게 요청을 보낼때마다 `Set-Cookie` 가 포함된 헤더를 매번 전송하게 된다. 그러면 서버는 클라이언트의 Cookie 요청 헤더를 확인하여 logined 값이 true 인지 여부를 판단하여 현재 로그인 상태 유무를 확인할 수 있다.

---

## 마치며

이렇게 기본적인 HTTP 웹 서버의 구축을 마쳤다. 하지만 아직 기능 추가, 리팩토링, 테스트를 거쳐할 부분이 많이 남아있다. 다음에는 현재 구현된 HTTP 웹서버 코드를 리팩토링 해보겠다.

---

## 더 학습해볼 키워드

- Legacy Code 를 개선하기 위한 고민
- LoggerFactory, ServerSocket, BufferedReader
- Session
