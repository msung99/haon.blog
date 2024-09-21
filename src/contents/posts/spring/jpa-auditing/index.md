---
title: JPA Auditing 으로 엔티티의 생성/수정 시간 자동 추적하기
date: "2024-09-03"
writer: 하온
tags:
  - Spring
  - JPA
  - 하온
previewImage: spring.png
---

## Auditing 

JPA 에서는 Audit 라는 기능을 제공하고 있다. Audit 는 사전적으로 `심사하다, 감사하다` 라는 뜻을 내포하는데, JPA 제공하는 Auditing 은 무엇이고, 어떻게 제공할까? 

**JPA 의 Auditing 기능은 엔티티가 생성되고, 변경되는 그 순간의 시점을 감지하여 생성시각, 수정시각, 생성한 사람, 수정한 사람을 기록할 수 있게 해준다.** 서비스를 운영시 생성된 데이터의 시점, 수정 일자를 기록한 뒤 추적할 때 유용하게 사용되는 기능이다. 

이번 포스트에선 JPA Auditing 기능을 간단한 실습과 함께 엔티티의 로그를 자동으로 기록하는 방법에 대해 학습하도록 한다.

## Auditing 활성화

가정먼저 `@EnableJpaAuditing` 어노테이션을 사용하여 Auditing 을 활성화해야 한다. 스프링부트내의 Application 클래스에 명시해도 되며, `@Configuration` 이 명시된 클래스를 별도로 생성하고 활성화시켜도 된다.

~~~java
@Configuration
@EnableJpaAuditing
public class JpaAuditConfig {
}
~~~

## BaseEntity 생성하기

생성시각(createdAt) 과 수정시각(updatedAt) 은 특정 엔티티에서만 사용되는 것이 아닌, 프로덕션 내의 대부분의 엔티티에서 사용되는 필드일 것이다. 모든 엔티티의 생성 및 수정 시점을 기록하고 트래킹하는 것은 유용하게 사용되기 떄문이다. 따라서 Auditing 를 적용한 클래스를 추상 클래스로 분리하고, 각 엔티티가 이 클래스를 상속받아서 사용할 수 있도록하여 중복 코드를 최소화시켜보자.

### BaseEntity

~~~java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
~~~

그런데 신기한 점들이 보인다. `@MappedSuperclass`, `@EntityListeners`, `@CreatedDate`, `@LastModifiedDate` 어노테이션의 기능은 무엇이고, 어떻게 사용되는 것일까?  

### @MappedSuperClass

`@MappedSuperClass` 어노테이션은 공통 매핑 정보가 필요할 때 부모 클래스에 선언된 필드를 상속받는 클래스에서 그대로 사용할 때 사용한다. 즉, BaseEntity 클래스를 상속한 모든 엔티티 클래스에는 `createdAt` 과 `updatedAt` 필드가 생성된다. 이때, 부모 클래스에서 대한 테이블은 별도로 생성되지 않는다.

### @EntityListeners

Auditing 을 적용할 엔티티 클래스에 적용해야하는 어노테이션이다. **이 어노테이션은 엔티티의 변화(이벤트)를 감지하여 엔티티와 매핑된 테이블의 데이터를 조작한다.**

이 어노테이션의 파라미터로 이벤트 리스너를 넣어줘야한다. 그래야지 어떤 이벤트가 발생했을 때 엔티티와 매핑된 테이블의 데이터를 조작할지 결정할 수 있기 때문이다. 필자의 경우 `AuditingEntityListener` 클래스를 넣어줬다. `AuditingEntityListener` 클래스는 엔티티의 영속, 수정 이벤트를 감지하는 이벤트 리스터 클래스다.

### @CreatedDate

생성날짜를 기록하려면 `LocalDateTime` 타입의 필드에 `@CreatedAt` 어노테이션을 명시한다. 그리고 생성날짜는 수정날짜와 달리 한번 생성되면 절대 수정되면 안되기 떄문에 `updatable = false` 을 적용해준다. 또한 null 값이여서도 안되므로 `nullable = false` 를 적용해준다. 

### @LastModifiedDate

수정날짜에 대해선 `@LastModifiedDate` 를 적용해준다. 엔티티가 수정될 때 마다 이벤트를 감지하고 그 수정날짜 시점을 필드에 최신화시킬 것이다.

## 테스트 환경에서 Auditing 활성화

만약 테스트 환경내의 레포지토리 레이어를 테스트할 때도 동일하게 생성 및 수정날짜를 자동 생성되도록 만들고 싶다면, 앞서 생성한 `@EnableJpaAuditing` 을 명시한 클래스를 Import 해주도록한다.

~~~java
@DataJpaTest
@Import(JpaAuditConfig.class)
public abstract class RepositoryTestConfig {
}
~~~


이렇게 까지 모두 마쳤다면, 여러 엔티티에서 생성날짜와 수정날짜를 쉽게 기록하고 추적할 수 있게된다.

