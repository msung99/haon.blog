---
title: 제 1장. 웹과 HTTP 는 이렇게 태어났고 성장했다.
date: "2024-07-29"
tags:
  - HTTP
series: 그림으로 배우는 HTTP & Network Basic
previewImage: infra.png
---

> 💡 본 포스트는 "그림으로 배우는 HTTP & Network Basic" 라는 책을 읽고 내 생각과 책 내용을 인용하여 작성했다.

## 웹은 HTTP 로 나타낸다.

우리는 브라우저 주소 입력란에 지정된 URL 에 의지해서 웹 서버로부터 리소스라고 불리는 파일등의 정보를 얻고있다. 이때, 서버에 의뢰를 하는 웹 브라우저 등을 클라이언트라고 부른다.
이렇게 클라이언트에서 서버까지 일련의 흐름을 결정하고 있는 것은 웹에서 `HTTP(Hypertext Transfer Protocol)` 이라고 불리는 프로토콜이다. 
프로토콜은이라는 의미는 "약속"이다. 즉, 웹은 HTTP 라는 약속을 사용한 통신으로 이루어져있다.

## HTTP 는 이렇게 태어났고 성장했다.

### 진보 안하는 HTTP

- `HTTP/0.9` : HTTP 가 등장항 때는 1990년인데, 이 당시 HTTP 가 정식 사양서는 아니었다. 이 당시 등장한 HTTP 는 1.0 이전이라는 의미에서 HTTP/0.9 로 불리고 있다.

- `HTTP/1.0` : HTTP 가 정식 사양으로 공개된 것은 1996년 6월이었다. 이떄 HTTP/1.0 으로 RFC1945 가 발행되었다. 초기의 사양이지만 현재에도 아직 많은 서버 상에서 현역으로 가동되고 있는 프로토콜 사양이다.

- `HTTP/1.1` : 1997년 1월에 공개된 HTTP/1.1 버전이 현재 가장 많이 사용되는 버전이다. 그 당시의 사양은 RFC2068 이지만 개정판으로 발행된 RFC2616 이 최신 버전이다. 

웹 문서 전송 프로토콜로써 등장한 HTTP 는 거의 버전이 업그레이드 되지 않았다. 현재 차세대를 담당할 HTTP/2.0 이 책정되어 있지만 널리 사용되기 까지는 아직 시간이 걸릴 것이다.
HTTP 는 등장한 당시에 주로 텍스트를 전송하기 위한 프로토콜이었지만, 프로토콜 자체가 상당히 심플해서 여러가지 응용 방법을 고려해 기능이 계속해서 추가되었다. 지금은 웹이라는 틀을 넘어서 다양하게 사용되는 프로토콜이 되었다.

## 네트워크의 기본은 TCP/IP

인터넷을 포함하여 일반적으로 사용하고 있는 네트워크는 TCP/IP 라는 프로토콜에서 움직이고 있다. HTTP 는 그 중 하나이다.

### TCP/IP 는 프로토콜의 집합

컴퓨터와 네트워크 기기가 상호간에 통신하기 위해서는 서로 같은 방법으로 통신하지 않으면 안된다. 예를들면, 어떻게 상대를 찾고, 어떻게 상대에게 이야기를 시작하고, 어떠한 언어로 이야기를 하며, 어떻게 이야기를 종료할까와 같은 규칙을 결정할 필요가 있다. 이렇게 서로 다른 하드웨어와 운영체제 등을 가지고 통신하기 위해선 모든 요소에 규칙이 필요하다. 이러한 규칙을 프로토콜이라고 한다.

프로토콜에는 여러가지가 있다. 케이블 규격이랑 IP 주소 지정방법, 떨어진 상대를 찾기 위한 방법과 그 곳에 도달하는 순서, 그리고 웹을 표시하기 위한 순서 등이다.
이렇게 인터넷과 관련된 프로토콜들을 모은 것을 TCP/IP 라고 부른다. TCP 와 IP 프로토콜을 가리켜 TCP/IP 라고 부르기도 하지만, IP 프로토콜을 사용한 통신에서 사용되고 있는 프로토콜을 총칭해서 TCP/IP 라는 이름이 사용되고 있다.

### 계층으로 관리하는 TCP/IP

TCP/IP 는 애플리케이션 계층, 트랜스포트 계층, 네트워크 계층, 링크 계층 이렇게 4계층으로 나뉘어 있다. 

TCP/IP 가 계층화된 것은 메리트가 있다. 예를들면, 인터넷이 하나의 프로토콜로 되어 있다면 어디선가 사양이 변경되었을 때 전체를 바꾸지 않으면 안되지만, 계층화되어 있으면 사양이 변경된 해당 계층만 바꾸면 된다. 각 계층은 계층이 연결되어 있는 부분만 결정되어 있어서, 각 계층의 내부는 자유롭게 설정할 수 있다.

또한 계층화를 하면 설계가 편하다. 애플리케이션 계층에서 애플리케이션은 자기 자신이 담당하는 부분을 고려하면 되고, 상대가 어디에 있는지, 어떠한 루트로 메시지를 전달하는지, 전달한 메시지가 확실하게 전달되고 있는지 등을 고려하지 않아도 된다.

#### 애플리케이션 계층

유저에게 제공되는 애플리케이션에서 사용하는 통신의 움직임을 결정하고 있다. TCP/IP 에는 여러가지의 공통 애플리케이션이 준비되어 있다. 예를들면 FTP 랑 DNS 등도 애플리케이션의 한 가지이다. HTTP 도 이 계층에 포함된다.

#### 트랜스포트 계층

트랜스포트 계층은 애플리케이션 계층에 네트워크로 접속되어 있는 2대의 컴퓨터 사이의 데이터 흐름을 제공한다. 트랜스포트 계층에서는 서로 다른 성질을 가진 TCP 와 UDP 2가지 프로토콜이 있다.

#### 네트워크 계층 (or 인터넷 계층)

네트워크 계층은 네트워크 상에서 패킷의 이동을 다룬다. 패킷이란 전송하는 데이터의 최소 단위이다. 이 계층에서는 어떠한 경로(이른바 절차) 를 거쳐 상대의 컴퓨터까지 패킷을 보낼지를 결정하기도 한다. 인터넷의 경우라면 상대 컴퓨터에 도달하는 동안에 여러대의 컴퓨터랑 네트워크 기기를 거쳐서 상대방에게 배송된다. 그러한 여러가지 선택지 중에서 하나의 길을 결정하는 것이 네트워크 계층의 역할이다.

#### 링크 계층 (or 데이터 링크 계층)

네트워크에 접속하는 하드웨어적인 면을 다룬다. 운영체제가 하드웨어를 제어하기 때문에 디바이스 드라이버랑 네트워크 인터페이스 카드(NIC) 를 포함한다. 그리고 케이블 등과 같이 물리적으로 보이는 부분(커넥트 등을 초함한 여러가지 전송 매체) 도 포함한다. 하드웨어직 측면은 모두 링크 계층의 역할이다.

### TCP/IP 통신의 흐름

TCP/IP 로 통신을 할때 순서대로 거쳐 상대와 통신한다. 송신하는 측은 애플리케이션 계층에서부터 내려가고, 수신하는 측은 애플리케이션 계층으로 올라간다. 

HTTP 를 예로들면, 먼저 송신측 클라이언트의 애플리케이션 계층(HTTP) 에서 어느 웹 페이지를 보고 싶다라는 HTTP 요청을 지시한다. 그 다음에 있는 트랜스포트 계층(TCP) 에선 애플리케이션 계층에서 받은 데이터(HTTP 메시지) 를 통신하기 쉽게 조각내어 안내 번호와 포트 번호를 붙여 네트워크 계층에 전달한다. 네트워크 계층(IP) 에서는 수신지 MAC 주소를 추가해서 링크 계층에 전달한다. 이로써 네트워크를 통해 송신할 준비가 되었다.

수신측 서버는 링크 계층에서 데이터를 받아들여 순서대로 위의 계층에 전달하여 애플리케이션 계층까지 도달한다. 애플리케이션 계층에 도달하게 되면 드디어 클라이언트가 발신했던 HTTP 요청 내용을 수신할 수 있다. 

각 계층으 거칠때는 반드시 헤더로 불려지는 해당 계층마다 해당 계층에 필요한 저보를 추가한다. 반대로 수신측에서는 각 계층을 거칠 대마다 반드시 해당 계층마다 사용한 헤더를 삭제한다. 이렇게 정보를 감싸는 것을 캡슐화라고 부른다.

## HTTP 와 관계가 깊은 프로토콜은 IP/TCP/DNS

TCP/IP 중에서 HTTP 와 관계가 깊은 IP, TCP, DNS 3개의 프로토콜에 대해 알아보자.

### 배송을 담당하는 IP

`IP(Internet Protocol)` 은 계층으로 말하자면 네트워크 계층에 해당된다. 실제 이름 그래도 인터넷을 활용하는 대부분의 시스템의 IP 를 활용하고 있다. IP 와 IP 주소를 혼동하는 사람이 있는데, IP 는 프로토콜의 명칭이다.

IP 의 역할은 개개의 패킷을 상대방에 전달하는 것이다. 상대방에게 전달하기까지 여러가지 요소가 필요하다. 그 중에서도 IP 주소와 MAC 주소가 중요하다. IP 주소는 각 노드에 부여된 주소를 가리키고, MAC 주소는 각 네트워크 카드에 할당된 고유의 주소다. IP 주소는 MAC 주소와 결부된다. IP 주소는 변경 가능하지만, 기본적으로 MAC 주소는 변경할 수 없다.

#### 통신은 ARP 를 이용하여 MAC 주소에서 한다

IP 통신은 MAC 주소에 의존해서 통신한다. 인터넷에서 통신 상대가 같은 랜선 내에 있을 경우는 적어서 여러대의 컴퓨터와 네트워크 기기를 중계해서 상대방에게 도착한다. 그렇게 중계하는 동안에는 다음으로 중계할 곳의 MAC 주소를 사용하여 목적지를 찾아가는 것이다. 이떄, ARP 이라는 프로토콜이 사용된다.

ARP 는 주소를 해결하기 위한 프로토콜 중 하나이다. 수신지의 IP 주소를 바탕으로 MAC 주소를 조사할 수 있다.

#### 그 누구도 인터넷 전체를 파악하고 있지는 않다

목적지까지 중계를 하는 도중에 컴퓨터와 라우터 등의 네트워크 기기는 목적지에 도달하기까지 대략적인 목적지만을 알고있다. 이 시스템을 라우팅이라고 부르는데, 택배 배송과 흡사하다. 화물을 보내는 사람은 택배 집배소 등에 화물을 갖고 가면 택배를 보낼 수 있는 것만 알고 있으며, 집배소는 화물을 보내는 것을 보고 어느 지역의 집배소에 보내면 되는지만 알고있다. 그리고 목적지에 있는 집배소는 어느 집에 배달하면 되는지만 알고있다. 결국, 어떤 컴퓨터나 네트워크 기기도 인터넷 전체를 상세하게 파악하고 있지는 못하다는 것이다.

### 신뢰성을 담당하는 TCP

TCP 는 계층으로 말하자면 트랜스포트 층에 해당하는데, 신뢰성 있는 바이트 스트림 서비스를 제공한다. 바이트 스트림 서비스란 용량이 큰 데이터를 보내기 쉽게 TCP 세그먼트라고 불리는 단위 패킷으로 작게 분해하여 관리하는 것을 말하고, 신뢰성 있는 서비스는 상대방에게 보내는 서비스를 말한다. 결국 TCP 는 대용량의 데이터를 보내기 위해 쉽게 작게 본해하여 상대방에게 보내고, 정확하게 도착했는지 확인하는 역할을 담당하고 있다.

#### 상대에게 데이터를 확실하게 보내는 것이 일이다

상대에게 확실하게 데이터를 보내기 위해서 TCP 는 3-way 핸드쉐이킹 방법을 사용한다. 이 방법은 패킷을 보내고나서 바로 끝내는 것이 아니라, 보내졌는지 여부를 상대에게 확인하러 간다. 이것은 SYN 와 ACK 이라는 TCP 플래그를 사용한다. 송신측에서는 최초 SYN 플래그로 상대에게 접속함과 동시에 패킷을 보내고, 수신측에서는 SYN/ACK 플래그로 상대에게 접속함과 동시에 패킷을 수신한 사실을 전한다. 마지막으로 송신측이 ACK 플래그를 보내 패킷 교환이 완료되었으을 전한다.

이 과정에서 어디선가 통신이 끊어지면 TCP 는 그와 동시에 같은 수순으로 패킷을 재전송한다. 

TCP 는 3-way 핸드쉐이킹 외에도 통신의 신뢰성을 보증하기 위해 다양한 시스템을 갖추고 있다.

## 이름 해결을 담당하는 DNS

DNS 는 HTTP 와 같이 응용 계층 시스템에서 도메인 이름과 IP 주소 이름 확인을 제공한다. 컴퓨터는 IP 주소와는 별도로 호스트 이름과 도메인 이름을 붙일 수 있다. 

DNS 는 도메인명에서 IP 주소를 조사하거나, 반대로 IP 주소로부터 도메인명을 조사하는 서비스를 제공하고 있다.

## 각각과 HTTP 와의 관계

IP, TCP, DNS 가 HTTP 를 이용해 통신을 할 때, 어떤 역할을 하는지 알아보자.

- TCP 담당 : 통신하기 쉽도록 HTTP 메시지를 패킷으로 분해 및 상대방에게 전송
- IP 담당 : 상대가 어디에 있는지 찾아 중계해 가면서 배송
- TCP 담당 : 상대방으로부터 패킷을 수신
- HTTP 담당 : 웹 서버에 대한 요청 내용을 처리

## URI 와 URL 

웹 브라우저 등으로 웹 페이지를 표시하기 위해 입력하는 주소가 바로 URL 이다. 예를들어 https://www.google.co.kr 이 URL 이다.

### URI 는 라소스 식별자

URI 는 Uniform Resource Identifiers 의 약자이지만, RFC2396 에서는 각각의 단어가 다음과 같이 정의되어 있다.

#### Uniform

통일된 서식을 결정하는 것으로, 여러가지 종류의 리소스 지정 방법을 같은 맥락에서 구별없이 취급할 수 있게 한다. 또한, 새로운 스키마(http: 와 ftp 등) 도입을 용이하게 한다.

#### Resource

리소스는 "식별 가능한 모든 것" 이라고 정의되어 있다. 도큐먼트 파일뿐만 아니라 이미지와 서비스(예를들면, 오늘의 일기 예보) 등 다른것과 구별할 수 있는 것은 모두 리소스이다. 또한 리소스는 단일한 부분만 아니라 복수의 집합도 리소스로 파악할 수 있다.

#### Identifier

식별 가능한 것을 참조하는 오브젝트이며 식별자로 불린다. 결국, URI 는 스키마를 나타내는 리소스를 식별하기 위한 식별자다. 스키마는 리소스를 얻기위한 수단에 이름을 붙이는 방법이다.

HTTP 는 "http" 를 사용한다. 그 외에도 "ftp" 와 "mailto" 등이 있다. 

URI 는 리소스를 식별하기 위해 문자열 전반을 나타내는데 비해, URL 은 리소스의 장소(네트워크 상의 윛) 를 나타낸다. URL 은 URI 의 서브셋이다. 

### URL 포맷

URI 는 필요한 정보 전체를 지정하는 완전 수식 절대 URI 혹은 완전 수식 절대 URL 과 브라우저 중의 기준 URI 에서 상대적 위치를 지정하는 상대 URL 이 있다. 여기선 절대 URI 포맷을 살펴보도록 한다.

```
http://user:pass@www.example.jp:80/dir/index.htm?uid=1#ch1
```
http : 스키마  /  user:pass : 자격정보(크리덴셜) / www.example.jp : 서버주소 / 80 : 서버포트 / dir/index.htm : 계층적 파일 패스 /  uid=1 : 쿼리 스트링 / ch1 : fragment 식별자


- `자격정보(크리덴셜)` : 서버로부터 리소스를 취득하려면 자격정보(크리덴셜) 가 필요하다. 유저명과 패스웨드를 지정할 수 있다. 이는 옵션이다.
- `서버 주소` : 완전 수식 형식인 URI 에서는 서버 주소를 지정할 필요가 있다. 주소는 DNS 주소, IPv4 주소, IPv6 주소를 대고라호로 묶어서 지정한다.
- `서버 포트` : 서버의 접속 대상이 되는 네트워크 포트 번호를 지정한다. 이것은 옵션이고, 생략하면 디폴트 포트가 사용된다.
- `계층적 파일 패스` : 특정 리소스를 식별하기 위해서 서버 상의 파일 패스를 지정한다. 
- `쿼리 스트링` : 파일 패스로 지정된 리소스에 임의의 파라미터를 넘겨주기 위해 쿼리 스트링을 사용한다. 이 또한 옵션이다.
- `fragment 식별자` : 주로 취득한 리소스에서 서브 리소스(도큐먼트 중간에 위치) 를 가리키기 위해서 사용된다. 이 또한 옵션이다.