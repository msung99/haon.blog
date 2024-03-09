---
title: SQL Injection 공격기법과 유형에 대해 알아보자!
date: "2022-12-14"
tags:
  - SQL Injection
  - HTTP
---

## 시작에 앞서

웹 해킹의 다양한 공략법 및 구조가 존재하며, 보안이 취약한 웹 페이지들은 악의적인 해커들로 인해 정보가 유출될 수 있습니다. 다양한 공격방법 중에 가장 쉬운 공격이면서, 취약점으로 손꼽힐 수 있는 SQL Injection 에 대해 알아보겠습니다.

원리부터 공격기법의 다양한 종류까지 자세히 살펴볼테니 꼼꼼히 읽어보시고 본인의 것으로 만드시면 좋겠습니다.

---

## SQL 은 왜 사용할까?

우선 기초적인 SQL의 특징에 대해 간단히 알아보겠습니다. 왜 개발할 때 SQL 을 사용해야 할까요?

웹 사이트를 운영하는데 있어 대용량의 데이터에 대한 관리 및 처리가 요구될 겁니다.
이런 데이터들을 단순히 텍스트 파일로 저장하거나, 파일로 간단하게만 관리한다면 양이 어마어마 하기 때문에 원하는 데이터에 대한 조회,삭제,수정등의 처리가 곤란해지기 때문에 사용하겠죠.

---

## SQL Injection

그럼 본격적으로 SQL Injection 에 대해 알아봅시다.

![](https://velog.velcdn.com/images/msung99/post/fefb8d99-3535-4c66-ba50-9477849884a4/image.png)

우선 Injection 의 뜻은 "삽입한다" 는 뜻입니다. 즉, **개발자가 만들어놓은 SQL 쿼리 문에 서비스 사용자의 데이터 입력값이 삽입된 후 악의적으로 활용되는 기법입니다.** 이때 서비스 사용자란 정상적인 사용자가 아닌, 해커들이 악의적으로 넣는 입력 데이터입니다.

서비스 사용자의 입력값이 서버측에서 코드로 입력되어 실행되는 **코드 인젝션 공격 기법** 중 하나입니다.

> sql injection 은 말 그대로 웹 사이트의 보안상 허점을 이용해 특정 sql 쿼리문을 전송하여 공격자(해커)가 원하는 데이터베이스의 중요한 정보를 가져오는 해킹 기법을 말합니다.

---

## SQL Injection 의 원리와 동작과정

자, 예를들어 아래와 같이 관리자 페이지가 따로 있다고 해보죠. 이 관리자 페이지에 접속하기 이전에, 현재 유저가 관리자 권한이 있는지를 검증해야 하는 로직이 필요할겁니다.

![](https://velog.velcdn.com/images/msung99/post/12134a04-97f3-41b5-b078-54a27876fc56/image.png)

검증을 위한 로직은 아래와 같이 select 문을 작성할 수 있을겁니다.

```sql
select * from User WHERE auth = 'admin' AND id = 'msung'
```

더 정확히 말하자면, 위 SQL 구문은 권한(auth 필드)이 관리자(admin) 이면서 아이디(id 필드) 가 msung 인 유저를 추출해내는 것입니다.
이때 외부로 부터 입력받은 데이터는 'admin' 과 'msung' 입니다.

그런데 만일 외부 입력으로 "im not admin" 과 " 'OR '1' = '1 " 을 입력받으면 어떻게 될까요? 즉 아래와 같은 SQL 문이 실행되는 상황을 가정해봅시다.

```sql
select * from User WHERE auth = 'im not admin' AND id = ' ' OR '1' = '1'
```

아이디가 스페이스 이거나(id = ' '), 또는 1이 1과 같은 경우 ('1' = '1') 라고 WHERE 조건을 걸어버린다면 무조건 참이 될겁니다.

즉 외부 입력으로 그 어떠한 auth 를 입력받고, id 입력을 받아오는지와 상관없이 '1' = '1' 라는 구문에 의해서 해커는 관리자 계정의 User 테이블의 모든 필드 정보를 얻을 수 있습니다.

cf) AND 연산자의 우선순위가 OR 연산자보다 높다는 것에 유념하세요.

---

## 해커의 악의적인 활용 사례

또한 최악의 경우, 아래와 같은 SQL Injection 도 활용해서 모든 유저의 정보를 DB 에서 삭제시켜 버릴 수도 있습니다.

외부 입력으로 "admin" 과 " '; DROP TABLE users;--' " 를 받아오는 경우입니다.

```sql
select * from User WHERE auth = 'admin' AND id = ' '; DROP TABLE Users;--'
```

조금 더 보시기 편하게 아래처럼 2줄로 나눠봤습니다.

```sql
select * from User WHERE auth = 'admin' AND id = ' ';
DROP TABLE User;--'
```

위와 같은 문자열을 파라미터로 해커를 통해 받는다면, 서비스에 존재하는 모든 유저에 대한 데이터가 날라가 버릴 수 있습니다.

첫번째 세미콜론을 통해 SQL문을 종료해버리고, 새로운 DROP 구문을 통해 삭제 요청을 보내서 삭제시킨 후에 뒤에 - 2개로 기존의 SQL 문을 주석처리 해버리는 것입니다.

---

## SQL Injection 의 다양한 공격기법 종류

이렇게 단순하면서도 취약한 SQL Injection 의 공격기법은 다양합니다. 그들에 대해 자세히 파해쳐보죠!

---

## 1. Classic SQL Injection

> 말 그대로 가장 근본적이며, 기초적인 SQL Injection 공격 기법을 의미합니다.

앞서 살펴본 내용들이 모두 이 공격기법에 해당합니다. SQL Injection 중에서 의 가장 일반적인 공격 방법이며, 공격자가 동일한 통신구간(ex. 브라우저) 에서 공격을 시도하고 결과를 얻을 수 있습니다.

### 참고) 추가적인 공격방법 예시

추가적으로 이 공격기법에 대한 다양한 SQL Injection 구문을 아래와 같이 적어놓겠습니다. 왜 공격에 취약한 구문인지 깊게 생각해보시고, 이해가 안가시다면 댓글로 물어보신다면 알려드리겠습니다!

```sql
select * from User where name = 'msung' and password = '1 or '1' = 1';
```

아래 예시는 외부 입력으로 "random_input OR 1=1 --" 과 "random_password" 를 입력받은 경우입니다.

- 구문에서 "--" 를 사용한 것은 주석입니다. -- 뒤에 오는 쿼리문의 문자열들 내용들을 모두 주석처리 시킨것이죠!

```sql
select * from User
where name = 'random_input' OR 1=1 -- 'AND password = 'random_password'
```

---

## 2. UNION based SQL Injection

SQL 을 공부하셨다면, UNION 명령어에 대해서도 잘 아실것이라 생각합니다.

> UNION 이란? : 여러개의 SQL 문을 합쳐 한번에 실행될 수 있는 SQL 문으로 만들어주는 것

즉, UNION 은 2개 또는 그 이상의 SELECT 문을 합쳐서 하나의 결과로 출력합니다. 이 UNION 의 특징을 활용하변 해커는 외부입력으로 UNION 과 추가적인 SELECT 문을 삽입해서 원하는 정보를 쏙 빼놓을 수 있게됩니다.

![](https://velog.velcdn.com/images/msung99/post/a4cfa609-6489-4617-9fa0-bca9de58a1f5/image.png)

#### SQL 쿼리문에 보내기

아래 예시는 외부 입력으로 "im not admin UNION select 1,1 --" 과 "hacker" 를 보낸 경우입니다.

```sql
select * from User where auth = 'im not admin' UNION select 1,1 -- and id = 'hacker'
```

그 어떤 id를 입력받더라도 주석처리가 되므로 검증 처리 대상에서 무시됩닉다.
또한 select 1,1 을 통해 항상 참이 되는 경우를 만들었기 때문에, 모든 유저의 정보를 탈취할 수 있는 SQL 구문이 된 것입니다.

#### URL 의 PathVariable 에 UNION 과 SQL 문을 보내는 경우

또 아래와 같이 특정 URL 에 GET 요청을 보내는 경우를 생각해봅시다.
외부 입력으로 "1 UNION SELECT 1 FROM User" 를 보낸 경우입니다.

```
http://mytest.com/getProduct/userIdx=1 UNION SELECT 1 FROM User
```

---

## 3. Error-based SQL Injection

> 해커가 의도적으로 잘못된 SQL 쿼리문을 DB에 요청해서 서버로부터 리턴받은 에러 메시지를 통해 DB의 정보를 파악하는 공격기법

![](https://velog.velcdn.com/images/msung99/post/730eff2b-aa52-4c32-af1e-5bc26ad3481c/image.png)

출처 : [펜테스트짐](https://www.bugbountyclub.com/pentestgym/view/53)

만일 문법적으로 허용되지 않는 오류가 있는 SQL 쿼리문을 DB 에 요청한다면, **DB 는 실행하지 못하고 왜 틀렸는지 알려주는 오류 구문를 리턴해줍니다.**

개발자를 이 오류를 방치한다면 오류 메시지를 일반 사용자도 쉽게 확인 가능하며, 이 메시지를 해커가 악용해서 공격에 필요한 정보로 활용할 수도 있습니다.

때로는 오류 메시지가 웹브라우저에는 출력이 안되더라도 HTML 소스코드의 주석에서 나타날 수도 있습니다.

---

## Blind Injection(Boolean Based Blind SQL Injection)

앞서 살펴본 SQL Injection 으로 공격당하는 상황 이외에, 외부 입력 쿼리에 대한 참, 거짓으로만 서버의 데이터를 일부 추출해내는 공격 기법입니다.

> 외부 입력으로 쿼리르 삽입하고, 해당 쿼리에 대한 참과 거짓 여부를 서버로 부터 리턴받고 DB의 내용을 추측해내는 공격기법

앞서 살펴본 내용은 원하는 데이터를 한방에 얻어내는 기법이였다면, 현 기법은 참과 거짓에 대한 서버의 반응을 살펴보고 정보를 추측해내는 기법이라고 할 수 있습니다.

이 기법은 **수많은 질의(QA)를 서버에 전송하고 그들을 토대로 결과를 조합하여 원하는 정보들을 얻어내면서 공격**을 하는 방식입니다. 이 방식은 수많은 시도를 외부입력으로 보내면서 DB의 정보를 추측해내야 하기 때문에, 해커들은 공격을 시도할때 **자동화된 툴을 사용**하여 공격을 계속 시도합니다.

#### 로그인 시도시 Blind SQL Injection 이 적용되는 사례

예를들어 아래와 같은 로그인 창에서 SQL 문을 입력하는 상황을 가정해봅시다.

![](https://velog.velcdn.com/images/msung99/post/0bd918fc-d405-48cc-a845-a69dc261483d/image.png)

```sql
SELECT user FROM users WHERE id'1' AND 1=1
SELECT user FROM users WHERE id'1' AND 1=2
```

왜 1=1 을 넣었을때는 유저가 존재하고, 1=2을 넣었을때는 유저가 존재하지 않는다고 리턴될까요?

- 1=2을 넣은 경우
  => 이 경우는 1과 2가 다르기 때문에 무조건 결과값이 거짓이 나옵니다. 따라서 해당 유저는 없다는 응답값을 리턴받게 되는 것이죠.

- 1=1을 넣은 경우
  => 이 경우는 1과 1이 같기 때문에 AND의 두 조건중 하나는 무조건 참인 것입니다. 나머지 조건인 id 값이 1이 존재하는지 여부를 검증하는 로직만 참이 성립한다면, 해커는 id 값이 1인 유저가 존재한다고 판단할 수 있게 됩니다.

> 이렇게 직접적으로 DB의 정보를 알수없더라도 참 거짓 응답값을 리턴받고 정보를 계속 추측해나가는 방식을 Blind SQL Injection 이라고 합니다.

---

## 마치며

지금까지 SQL Injection 이란 무엇인지 알아봤습니다. 저는 최근에 이 내용을 학습할 때 꽤 어려웠던 내용같았는데, 이 포스팅을 참고하시는 분들은 꼭 자세히 읽어보시고 도움이 되셨으면합니다.

또 각 공격기법에 대한 해결&대응방안이 있는데, 이는 조만간 새로운 포스팅과 함께 내용을 구성해보겠습니다.

---

## 참고

[MicroSoft SQL Injection : Documentation](https://learn.microsoft.com/en-us/sql/relational-databases/security/sql-injection?view=sql-server-ver16)
https://www.bugbountyclub.com/pentestgym/view/52
https://portswigger.net/web-security/sql-injection
https://m.blog.naver.com/lstarrlodyl/221837243294
https://gomguk.tistory.com/118
https://hyjykelly.tistory.com/5
https://dpdpwl.tistory.com/98
https://hyotwo.tistory.com/70
https://www.youtube.com/watch?v=OUGrSB0CAxs
