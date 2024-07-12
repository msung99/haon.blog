---
title: Nginx 기반 HTTPS 프로토콜을 적용하여 서비스 배포하기
date: "2023-01-31"
tags:
  - Nginx
  - HTTPS
  - CertBot
previewImage: infra.png
series: Nginx
---

## 시작에 앞서

이번에는 마지막으로 https 를 서비스에 적용시켜 보겠습니다.

---

## SSL 이란?

SSL(Secure Socket Layer) 이라는 약자로, 443 포트를 사용하며, 모든 정보전송을 암호화프로토콜을 사용하여 안전하게 전송되도록 만드는 것입니다.

클라이언트와 서버(Nginx) 간의 통신 내용이 노출되거나 변경되는 것을 방지할 수 있으며, 클라이언트가 접속하려는 서버가 신뢰할 수 있는 서버인지 확인이 가능합니다.

### SSL 송수신 절차

SSL 에서는 암호화를 사용하는데, 암호/키를 통해 신뢰할 수 있는 서버인지를 다음 절차로 확인합니다.

- 클라이언트가 서버에 접속
- 서버는 클라이언트에게 인증서 정보전달(SSL 인증서를 발급하여 나 이만큼 신뢰성있는 서버야! 라고 클라이언트에게 인증서를 보내서 검증받으려고 하는것)
- **클라이언트는 인증서 정보가 신뢰할 수 있는 것인지 검증**
- 검증후 원하던 요청을 수행

---

## HTTPS

HTTP, HTTPS 는 둘다 정말 많이 사용하는 프로토콜입니다. HTTPS 는 모든 요청과 응답 데이터가 네트워크로 보내지기 전에 암호화됩니다.

특히 **HTTPS 는 하부에 SSL 과 같은 보안계층을 제공하여 동작합니다.**

---

## Let's Encrypt 발급기관, Certbot

이제부터 본론 내용 시작입니다. 저희는 아래와 같은 환경에서 HTTPS 프로토콜에 기반에 통신을 할겁니다.

![](https://velog.velcdn.com/images/msung99/post/91aa3602-ddaf-48da-9b4c-80625d54a231/image.png)

[[Nginx] 로드밸런싱 환경을 구축해 트래픽 분산시키기 (feat. 무중단배포)](https://velog.io/@msung99/Nginx-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1-%ED%99%98%EA%B2%BD%EC%9D%84-%EA%B5%AC%EC%B6%95%ED%95%B4-%ED%8A%B8%EB%9E%98%ED%94%BD-%EB%B6%84%EC%82%B0%EC%8B%9C%ED%82%A4%EA%B8%B0-feat.-%EB%AC%B4%EC%A4%91%EB%8B%A8%EB%B0%B0%ED%8F%AC) 에서도 설명했듯이, WAS 서버는 뒷단에 감추어짐으로써 IP주소가 유출되지 않고 보안성이 강화되었습니다. 이어서 이번에는 **Nginx 라는 프록시 서버에 SSL 인증서를 발급해둠으로써 HTTPS 를 적용**시켜볼겁니다. WAS 서버가 여러대로 확장되더라도 추가 SSL 인증서 발급이 필요하지 않으니 확장성이 유리합니다.

또 무료 SSL 발급기관으로 Let's Encrypt 를 사용해서 인증서를 발급받을 것이며, Let's Encrypt 기관으로부터 간단한 SSL 발급 절차를 밟도록 Certbot 를 사용하겠습니다.

---

## Domain 설정

SSL 를 적용시키기 위해선 도메인 하나를 셋팅해주고, 해당 도메인을 통해 인증서를 발급받고 HTTPS 를 적용시킬 수 있습니다. 저는 [Gabia(가비아)](https://www.gabia.com/?utm_source=google&utm_medium=cpc&utm_term=%25EA%25B0%2580%25EB%25B9%2584%25EC%2595%2584&utm_campaign=%25EA%25B0%2580%25EB%25B9%2584%25EC%2595%2584) 에서 500원짜리 도메인을 구입하고, 인증서를 발급받는 절차를 진행하겠습니다.

### Domain 호스트 설정

도메인을 준비하셨다면 호스트 설정을 진행해주셔야합니다. 본인이 구매한 도메인에 대한 수정 페이지로 들어가서, 아래와 같이 호스트 설정을 꼭 진행해주시길 바랍니다. 이때 값/위치에는 Nginx 서버의 IP 주소를 기입해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/e6d229e2-22ff-4a6b-abdd-8e4b5de6c252/image.png)

---

## Nginx & 스프링부트 WAS 서버 환경구성

### Nginx 설정파일 생성

지난번에 진행했던 로드밸런싱 환경과 동일합니다.
다만 지난번에는 /etc/nginx/sites-enabled 에 Nginx 로드밸런싱 관련 설정파일을 생성했으나, 기존 파일을 삭제한 후 이번에는 /etc/nginx/conf.d 에 새롭게 설정파일을 만들겠습니다.

- 쉽게말해, 그냥 /etc/nginx/conf.d 에 Nginx 설정파일을 새롭게 만들어 준다고 이해하시면 됩니다!

```java
$ cd /etc/nginx/sites-enabled
$ rm -rf myapp    // 이 명령들은 지난번 제 포스팅을 안따라하셨다면 무시하세요!

// conf.d 에다 Nginx 설정파일 생성
$ cd /etc/nginx/conf.d
$ vim default.conf
```

### 설정정보 구성

그리고 생성한 default.conf 설정파일에 아래와 같이 설정정보를 구성합시다.

```java
upstream backend{
        server 111.111.11.111:8080;
        server 222.222.22.222:8080;
        server 333.333.33.333:8080;
}

server{
		listen 80;
        server_name mymsung.store;  // 도메인 주소

        location / {
                proxy_pass http://backend;
        }
}
```

server_name 은 앞서 구매한 도메인 주소(SSL 적용할 도메인) 을 기입해줍시다. 추후 Certbot 이라는 것을 활용할것인데, Certbot은 server_name 옵션을 기준으로 Nginx 설정 파일을 찾고, 여기에 HTTPS 에 대한 설정을 자동으로 추가해주기 때문입니다.

---

## Certbot 설치 & Let's Encrypt로 부터 인증서 발급

Certbot 이란 앞서 말씀드렸듯이, L**et's Encrypt 이라는 SSL 인증서 발급기관으로부터 손쉽게 SSL 인증서를 자동 발급할 수 있게 도와주는 도구**입니다.

### Certbot 설치

Ubuntu 에서는 Certbot를 설치시 아래처럼 snap 이라는 패키지를 통해 설치하는 것을 권장합니다. 따라서 apt 가 아닌 snap 으로 설치해봅시다.

이때 이메일 정보를 물어본 후 1번과 2번중 선택하라는 질문이 나오는데, **2번을 선택해주시면 http 로 URL을 접근할 경우 자동으로 https 로 리다이렉트가 됩니다.** 가급적이면 보안성을 위해 2번으로 해주시는게 좋겠죠?

```java
$ sudo snap install certbot --classic
```

### SSL 인증서 발급받기

이어서 Nginx 서버에다 SSL 인증서를 발급받도록 합시다.

```
$ sudo certbot --nginx
```

그러면 아래와 같이 어떤 도메인에 대해 HTTPS 를 적용시킬 것인지를 물어봅니다. 저희는 질문에 대답이 적합하게 원하는 숫자를 기입해주면 됩니다. 이 상황에서는 1을 입력하면 되겠죠?

![](https://velog.velcdn.com/images/msung99/post/c9da2039-27c1-49df-b76a-1bee207ed789/image.png)

이 과정까지 끝난다면 Certbot 은 자동으로 Let's.Encrypt 발급처를 통해서 자동으로 SSL 를 인증서를 발급해옵니다.

---

## HTTPS 자동 설정 확인해보기

그리고 /etc/nginx/default.conf 파일을 다시 열여보면 HTTPS 에 대한 각종 설정 내용들이 자동으로 반영된 것을 볼 수 있습니다.

```java
upstream backend{
         server 111.111.11.111:8080;
         server 222.222.22.222:8080;
         server 333.333.33.333:8080;
}

server{
        server_name mymsung.store;

        location / {
                proxy_pass http://backend;
        }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mymsung.store/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mymsung.store/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}


server{
    if ($host = mymsung.store) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

        listen 80;
        server_name mymsung.store;
    return 404; # managed by Certbot
}
```

앞서 2번으로 설정시 http 로 들어온 요청이 https 로 자동으로 리다이렉션된다고 했었죠? 그 내용도 자동 추가되었습니다.

```java
server{
    if ($host = mymsung.store) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

        listen 80;
        server_name mymsung.store;
    return 404; # managed by Certbot
}
```

이 일부분을 뜯어내서 자세히 보면, HTTP 요청으로 들어온 호스트(host) 가 mymsung.store 인 경우 301 상태코드를 활용하여 리다이렉션 시켜주는 모습을 볼 수 있습니다.

실제로 리다이렉션이 잘 되는지를 확인해봅시다. 아래와 같이 그냥 http 요청을 보낸다면

![](https://velog.velcdn.com/images/msung99/post/bbff2f80-5f8b-45a3-9b29-fd7bc19b611a/image.png)

자동으로 https 로 리다이렉셕된 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/cc046c75-0919-4d77-aac8-fa95e253bd3d/image.png)

---

## SSL 자동갱신

Let's Encrypt 에서 발급해주는 인증서는 90일짜리 단기 인증서로, 영구적이지 않습니다. 저희는 90일마다 직접 인증서를 다시 받아오는 귀찮은 작업을 하지말고, Crontab 이라는 것을 활용합시다.

Crontab 이란 스캐쥴링 도구로써, 특정한 주기로 명령어를 수행할 떄 사용합니다. 아래처럼 crontab 에 접속해서 스캐큘링 설정정보를 추가해봅시다.

```java
$ crontab -e
```

접속하셨다면 맨 아래줄에 아래 내용을 기입해주세요! 매월, 매일 0시0분에 certbot 을 실행하고 SSL 를 새롭게 발급받은 후 Nginx.conf 파일을 reload 해주는 것입니다.

```java
0 0 * * * certbot renew --post-hook "sudo service nginx reload"
```

설정 구성이 끝났다면 CTRL + X 로 빠져나올 수 있습니다.

---

## 마치며

이렇게 Nginx 서버에서 어떻게 SSL 를 자동 발급받고 HTTPS 프로토콜에 기반해 통신할 수 있을지에 대해 자세히 다루어봤습니다. Nginx 를 학습하시는 모든 분들에게 도움이 되셨으면 합니다 😉

---

[Certbot Docs](https://eff-certbot.readthedocs.io/en/stable/)
[[Nginx] Let's Encrypt - SSL Certificates](https://minholee93.tistory.com/entry/Nginx-Lets-Encrypt-SSL-Certificates)
[https 적용하기 - certbot. Let's encrypt](https://junho85.pe.kr/2048)
[Let's Encrypt 로 https 적용하기](https://syudal.tistory.com/entry/Ubuntu-Nginx-Lets-Encrypt%EB%A1%9C-https-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0)
[[linux][crontab -e 에서 빠져나오기]](https://linuxmadang.tistory.com/entry/linuxcrontab-e-%EC%97%90%EC%84%9C-%EB%B9%A0%EC%A0%B8%EB%82%98%EC%98%A4%EA%B8%B0)
[gabia](https://www.gabia.com/)

.
