---
title: 제 3장. HTTP 정보는 HTTP 메시지에 있다
date: "2024-08-01"
tags:
  - HTTP
series: 그림으로 배우는 HTTP & Network Basic
previewImage: infra.png
---

> 💡 본 포스트는 "그림으로 배우는 HTTP & Network Basic" 라는 책을 읽고 내 생각과 책 내용을 인용하여 작성했다.

## HTTP 메시지

HTTP 에서 교환하는 정보는 HTTP 메시지라고 불리는데, 요청 측 HTTP 메세지를 Request Message, 응답 측 HTTP 메시지를 Response Message 라고 부른다.

HTTP 메시지는 복수 행의 데이터로 구성된 텍스트 문자열이다. HTTP 메세지는 크게 구분하면 메시지 헤더와 메시지 바디로 구성된다. 또한 최초에 나타내는 개행 문자로 메시지 헤더와 메시지 바디를 구분한다. 이 안에 메시지 바디가 항상 존재한다고는 할 수 없다.

- 메시지 헤더 : 서버와 클라이언트가 꼭 처리해야 하는 요청과 응답 내용과 속성 등
- 개행 문자 : CR + LF
- 메시지 바디 : 꼭 전송되는 데이터 그 자체

## Request Message 와 Response Message 의 구조

요청 메시지와 응답 메시지의 구조를 살펴보도록 하자. 요청 메시지와 응답 메시지의 헤더 내부는 아래와 같은 데이터로 구성되어 있다. 

- Request Line : 요청에 사용하는 HTTP Method, Request URI, HTTP 버전등이 포함되어 있다.
- Status Line : 응답 결과를 나타내는 상태 코드와 설명, HTTP 버전이 포함된다.
- Header Field : 요청과 응답의 여러 조건과 속성 등을 나타내는 각종 헤더 필드가 포함된다. 일반 헤더 필드, 요청 헤더 필드, 응답 헤더 필드, 엔티티 헤더 필드 총 4가지의 종류가 있다.
- 기타 : HTTP 의 RFC 에는 없는 헤더 필드(쿠기 등등) 가 포함되는 경우가 있다.

#### Request Message 예시

~~~
GET HTTP/1.1
Host: hackr.jp
User-Agent: Mozzlla/5.0 
Accept: tecx/html,application/xhtml+xml,application/xml;q=0.9,*/*
Accept-Language: ja,en-us;q=0.7,en;q=0.3
Accept-Encoding: gzip, deflate
DNT: 1
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache
~~~

#### Response Message 예시

~~~
HTTP/1.1 200 OK
Date: Fri, 13 Jul 2020 02:45:46 GMT
Server: Apache
Last-Modified: Fri, 31 Aug 2007 02:20:20 GMT
ETag: ~~
Accept_Ranges: ~~
Content-Length: 362
Connection: Close
Content-Type: text/html

<html>
  // ...
</html>
~~~

## 인코딩으로 전송 효율을 높이다

HTTP 로 데이터를 전송할 경우 그대로 전송할 수도 있지만, 전송할 때에 인코딩(변환)을 실시함으로써 전송 효율을 높일 수 있다. 전송할 떄 인코딩을 하면 다량의 엑세스를 효율 좋게 처리할 수 있다. 단지, 컴퓨터에서 인코딩 처리를 해야하기 때문에 CPU 등의 리소스는 보다 많기 소비하게 된다.

### 메시지 바디와 엔티티 바디의 차이

- 메시지(Message) : HTTP 통신의 기본 단위로 옥텟 시퀀스(8비트) 로 구성되고 통신을 통해서 전송된다.
- 엔티티(Entity) : 요청과 응답의 페이로드(payload) 로 전송되는 정보로, 엔티티 헤더 필드와 엔티티 바디로 구성된다.

HTTP 메시지 바디의 역할을 요청과 응답에 관한 엔티티 바디를 운반하는 일이다. 기본적으로 메시지 바디와 엔티티 바디는 같지만, 전송 코딩이 적용된 경우에는 엔티티 바디의 내용이 변화하기 떄문에 메시지 바디와 달라진다. 


### 압축해서 보내는 콘텐츠 코딩

메일에 파일을 첨부해서 보낼 경우 같이 용량을 줄이기 위해서 파일을 zip 으로 압축하고 나서 첨부해서 보내는 일이 있다. HTTP 에는 이와 같은 일이 가능한 `콘텐츠 코딩(Contents Coding)`이라고 불리는 기능이 구현되어 있다. 콘텐츠 코딩은 엔티티에 적용하는 인코딩을 가리키는데, 엔티티 정보를 유지한채로 압축한다. 콘텐츠 코딩된 엔티티는 수신한 클라이언트 측에서 디코딩한다.

### 분해해서 보내는 청크 전송 코딩

HTTP 통신에서는 요청했었던 리소스 전부에서 엔티티 바디의 전송이 완료되지 않으면 브라우저에 표시되지 않는다. 사이즈가 큰 데이터를 전송하는 경우에 데이터(엔티티 바디)를 작게 쪼개고 나서 조금씩 송신할 수 있다. 또한 이때 쪼개진 각각의 작은 단위 하나를 `청크` 라고 부른다. 이렇게 엔티티 바디를 분할하는 기능을 `청크 전송 코딩(Chunked Transfer Coding)` 이라고 부른다.

### 여러 데이터를 보내는 멀티파트


MIME은 메일로 텍스트, 영상, 이미지같은 다양한 데이터를 보내기 위해 사용되었다. 이것이 이메일에서 잘 작동하여 HTTP에서 여러 다른 종류 데이터를 한번에 보내는 방식에 채택되었고, 이는 멀티파트라고 불린다. HTTP 에서 멀티파트를 사용하면 메시지 바디 내부에 엔티티를 여러개 포함하여 보낼 수 있다. 이때, 이미지, 텍스트 파일 등을 실어 보낼 수 있다.

멀티파트에는 다음과 같은 것들이 있다.

#### multipart/form-data

Web 폼으로부터 파일 업로드에 사용된다.

~~~
Content-Type: multipart/form-data; boundary=AaB03x

--AaB03x
Content-Deisposition: form-data; name="field1"

Joe Blow
--AaB03x
Content-Disposition: form-data; name="pics"; filename="fiel1.txt"
Content-Type: text/plain
... (file1.txt데이터) ...
--AaB03x--
~~~

#### multipart/byteranges
 
상태 코드 206(Partial Content) 응답 메시지가 복수 범위의 내용을 포함하는 떄에 사용된다.

~~~
HTTP/1.1 206 Partial Content
Date: Fri, 13 Jul 2012 02:45:26 GMT
Last-Modified: Fri, 31 Aug 2007 02:02:20 GMT
Content-Type: multipart/byteranges; boundary=THIS_STRING_SEPARATES

--THIS_STRING_SEPARATES
Content-Type: application/pdf
Content-Range: bytes 500-999/8000

...(지정한 범위의 데이터)...
--THIS_STRING_SEPARATES
Content-Type: application/pdf
Content-Range: bytes 7000-7999/8000
--THIS_STRING_SEPARATES--
~~~

HTTP 메시지로 멀티파트를 사용할 때는 Content-Type 헤더 필드를 사용한다. 그리고 멀티파트에서 각 엔티티를 구분하기 위해서 boundary 문자열을 사용한다. 각 엔티티 앞에는 -- 묹 뒤에 boundary 문자열을 붙인다. 그리고 멀티파트의 마지막은 -- 문자를 boundary 문자열 앞 뒤로 붙여 끝을 알린다.

## 일부분만 받는 레인지 Request

옛날 시절에는 대용량의 이미지와 데이터를 다운로드하기 힘들었다. 다운로드 중에 커넥션이 끊어지면 처음부터 다시 다운로드를 해야했기 떄문이다. 이런 문제를 해결하기 위해 일반적인 `제개(resume)` 이라는 기능이 필요하게 되었다. 제개를 통해 이전에 다운로드를 한 곳에서부터 다운로드를 다시 시작할 수 있다. 

이 기능을 실현하기 위해선 엔티티의 범위를 지정해서 다운로드를 할 필요가 있다. 이와 같이 범위를 지정하여 요청하는 것을 `레인지 요청(Range Request)` 라고 부른다. 레인지 요청을 사용하면 전체 1만 바이트 정도 크기의 리소스에서 5,001 ~ 10,000 바이트 사이의 범위(바이트 레인지) 만을 요청할 수 있게된다.

레인지 리퀘스트를 할 떄는 Range 헤더 필드를 사용해서 리소스의 바이트 레인지를 지정한다.

~~~
Range: bytes = 5001-10000
~~~

레인지 리퀘스트에 대한 응답은 상태 코드 `206(Partial Content)` 이라는 메시지가 되돌아온다. 또한, 복수 범위의 레인지 리퀘스트에 대한 응답은 `multipart/byteranges` 로 응답이 되돌아온다. 한편 서버가 레인지 리퀘스트에 지원하지 않는 경우라면 상태 코드 200 이 되돌아온다.

## 최적의 콘텐츠를 돌려주는 컨텐츠 네고시에이션

같은 컨텐트이지만 다르게 표현되어야 하는 페이지가 있을 것이다. 이를테면, 영어 페이지와 한국어 페이지를 따로 제공할 떄가 있을 것이다. 컨텐츠 네고시에이션이란 말 그대로 클라이언트에게 더 적합한 컨텐츠를 제공하기 위해 서버와 클라이언트가 리소스 내용에 대해 협상하는 것이다.

컨텐츠 네고시에이션은 리소스를 언어, 문자 세트(charset), 인코딩 방식 등을 기준으로 판단한다. 판단 기준은 **Accept, Accept-Charset, Accept-Encoding, Accept-Language, Content-Lanugage** 등의 요청 헤더 필드다.

