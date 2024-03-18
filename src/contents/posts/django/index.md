---
title: Django의 Mapping & DB 접근방식
date: "2022-11-14"
tags:
  - 스프링
  - Django
previewImage: server.png
---

## 배경

항상 Django 프로젝트를 진행하다가, 햇갈리는 점이 정말 많았습니다. 분명 Django 에서는 당연하게 사용했던 것들이 왜 작동이 안되지? 왜 이런방식으로 사용해야하는걸까? 하는 의문이 많이 생겼던 것 같습니다.

Django 로 개발하던 당시에는 "객체를 데이터베이스에 저장한다" 라는 표현을 자주 사용했었으나 이 표현이 이상하다는 생각도 듭니다. 객체를 저장하는 것이 아니라, 데이터베이스와 매핑을 시켜주는 역할이 별도로 필요하다 말을 듣고 혼동이 왔습니다.

---

## ORM(Object Relational Mapping)

우선 장고와 스프링을 대조, 비교하기 위해선 ORM 의 개념에 대해 알아야합니다. 그렇다면 ORM 이 뭘까요?

ORM 이란 이름에서도 알 수 있듯이,**객체와 관계형 데이터베이스를 Mapping 시켜주는 역할** 을 하는 녀석들을 의미합니다.

> 객체 <=> 매핑(ORM) <=> 데이터베이스

다시 강조하면, 객체와 데이터베이스를 중간에서 연결시켜주는 것이 바로 ORM 인겁니다. 이는 다시말해사, **객체 자체를 데이터베이스에 저장한다는 행위는 엄밀히는 틀린 표현**이 될수 있겠습니다. 객체를 저장하는 행위가 발생하는 것은 곧 ORM 을 통해서 변형된 데이터들이 데이터베이스에 저장된다고 볼 수 있겠습니다.

---

## ORM이 없다면? : SQL을 일일이 작성해야 할까?

저희는 로직을 구성하면서 CRUD 를 위해 SQL 을 작성할 필요없이, 객체를 정의하고 **ORM 이 제공하는 메소드를 사용하여 데이터베이스에 쉽게 접근할 수 있습니다.** 이 과정에서 자동으로 SQL 쿼리문을 생성하면서 매핑이 되는 원리인거죠.

ORM 이 없는 상황이라면 개발자들은 DB 에 접근하기 위해서 각 논리연산 단위에 대해 SQL 을 작성해서 접근해야 합니다. 이렇게 되면 비즈니식 로직이 꽤나 복잡해지고 가독성이 줄어들겁니다.

---

## ORM을 제공하는 Framework 타입

ORM 을 제공하는 프레임워크는 여러가지가 있는데, 대표적으로는 아래와 같습니다.

> - Sequelize (Node.js)

- JPA/Hibernate (Java)
- Django의 ORM (Django 에서 자체적으로 제공)

---

## Django에서 제공하는 ORM

바로 앞서 말씀드렸듯이 Django 에서는 자체적으로 ORM 을 제공해줍니다. 이로인해 DB 에 접근하는 방식을 깊이 이해할 필요없이, 또 SQL 을 굳이 알필요없이 **자동으로 객체와 데이터베이스를 이어주는 기능**을 보유하고 있다고 볼 수 있죠.

Django의 모델은 데이터베이스에 매핑되는 객체입니다. 보통 하나의 모델은 하나의 테이블에 Mapping 되고, 클래스내의 Attribute 들은 테이블내의 필드를 나타냅니다.

---

## JDBC Template : SQL을 통해 직접 DB에 접근해야한다👴

위에도 언급해놓았듯이, 이 방식은 **SQL 쿼리문을 일일이 작성해서 힘들게 DB에 접근하는 방식**입니다. 잘 이해가 안가신다면, 아래 코드를 보시죠! 최근에 제가 작성했던 코드입니다.

참고로 스프링에는 마치 ORM 이 없는듯한 뉘양스로 말씀드린것같은데, 스프링에도 JPA/Hibernate 라는 편리한 ORM 을 제공하고 있습니다.

---

## ManyToMany (N:N 관계) 구현방식의 차이

### JdbcTemplate

다대다관계, 즉 N:N 관계를 활용한 예시입니다. 우선 아래의 코드는 teamIdx 에 해당하는 Team 에 대한 모든 User 들을 조회하는 API 입니다. 즉, 특정팀에 속하는 모든 사용자들을 GET 요청으로 조회하는 API 라고 보시면 됩니다.

- 아래 코드는 완전히 이해하실 필요가 없습니다. 저희가 짚고 넘어갈 중요한 사항은 바로 **ORM을 사용했을 떄와 사용하지 않았을 때의 간결성 및 직관성의 차이**입니다.

```java
public List<GetUser> getTeamMembers(int teamIdx){
        String getTeamAllUserIdxQuery = "select userIdx from Mapping where teamIdx = ?"; // teamIdx 값에 속하는 팀에 속하는 유저들의 userIdx 값들을 추출

        // userIdx 값들이 추출해서 userIdx값들이 저장된 GetUserIdx 리스트 생성
        java.util.List<GetUserIdx> GetUserIdxList = this.jdbcTemplate.query(getTeamAllUserIdxQuery,
                (rs, rowNum) -> new GetUserIdx(
                        rs.getInt("userIdx")), teamIdx);

        List<Integer> userIdxlist = new ArrayList<Integer>();
        // 각 GetUserIdx 객체로부터 userIdx 값을 추출해서 int형 리스트 생성
        for(GetUserIdx getUserIdx : GetUserIdxList){
            userIdxlist.add(getUserIdx.getUserIdx());
        }

        // 반복문으로 순환하면서 얻어온 각 userIdx 값을 기반으로 GetUser 리스트 생성
        List<GetUser> getUserList = new ArrayList<GetUser>();
        String GetUserQuery = "select * from User where userIdx = ?";

        for(int eachUserIdx : userIdxlist){
            // DB 로 부터 User 를 얻어와서
            GetUser eachUser = this.jdbcTemplate.queryForObject(GetUserQuery,
                    (rs, rowNum) -> new GetUser(
                            rs.getInt("userIdx"),
                            rs.getTimestamp("createdAt"),
                            rs.getString("email"),
                            rs.getInt("is_connected"),
                            rs.getString("nickname"),
                            rs.getString("password"),
                            rs.getString("status"),
                            rs.getTimestamp("updatedAt"),
                            rs.getString("userProfileImgUrl")),
                    eachUserIdx);
            // GetUser 리스트에 추가
            getUserList.add(eachUser);
        }

        return getUserList;
```

보시듯이 SQL 을 통해 데이터베이스에 접근하는 방식은 정말 귀찮아지는 작업입니다. 따라서 ORM 은 선택이 아닌 필수가 되었다고 할 정도이며, 위와 같은 방식은 이미 10년정도나 지난 오래된 개발 방식입니다.

### Django의 ORM을 활용했다면?

위의 예시와 다른 서비스에서 제가 개발했던 코드를 가져와봤습니다. 하지만 동일한 원리와 로직을 지닌 코드인데, 보시듯이 직접 DB 에 접근하는 구시대 방식에 비해 ORM 을 활용하니 코드가 훨씬 직관적이며 간결해졌습니다.

![](https://velog.velcdn.com/images/msung99/post/741dda4a-9722-4c55-90e0-0fb3ff9f60f1/image.png)

---

## Django의 Migration

스프링과 달리 (JPA와 같은 ORM 제외) Django에서는 손쉽게 Model 에 대한 변경사항을 손쉽게 반영할 수 있습니다. Django의 Migration 이란 Model 의 변경, 수정사항등을 데이터베이스의 스키마에 반영하는 과정입니다.

Django 로 개발을 한번이라도 하셨던 분들이라면 Sqlite3 와 같은 데이터베이스에 변경사항을 반영해주기 위해 아래와 같은 코드 단 한줄로 손쉽게 변경사항을 반영하는 것이 가능한 것을 아셨을 겁니다.

```
python manage.py makemigrations
```

---

## ORM의 필요성

ORM 은 이로써 백엔드 개발자라면 꼭 알야할 지식이라는 생각이듭니다.
ORM 을 사용함으로써 어떤 이점이 존재하는지 정리해보면 아래와 같습니다.

> - 쿼리를 객체 관점으로 작성함으로써 재사용성을 높일 수 있다.

- 반복되는 코드를 줄일 수 있다.
- 특정 데이터베이스가 아닌 범용적으로 작성할 수 있다.
- 생산성을 높일 수 있다.

몰론 ORM 도 단점은 존재합니다. ORM 관련 메소드를 잘 모른다면 문제를 해결하기 힘들며, 잘못 사용할 경우 오히려 최적화를 하려던것이 성능이 매우 떨어질 수 있으며, 연관관계 또한 잘못 맺을경우에 원하는 흐름대로 작성되지 않을 수도 있습니다.

ORM 을 사용하는 것은 정말 좋습니다. **다만 왜 사용을 해야하는지, 어떤 방식으로 DB 에 접근하는 것인지 등을 충분히 이해하시고나서 ORM 을 깊게 학습하는것을 권장드립니다.**
