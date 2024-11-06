---
title: 자바에서 리플렉션 (Java Reflection) 사용하기
date: "2024-10-22"
tags:
  - JAVA
  - 리플렉션
previewImage: java.png
---

## 자바 리플렉션 (Java Reflection)

자바는 캄파일이 시작되면, 컴파일러가 자바 코드로 작성된 클래스 정보들을 바이트 코드로 변환해준다. 그리고 클래스 로더(Class Loader) 는 변환된 이 바이트 코드를 읽어들여서 JVM 내에 메모리 영역에 저장한다. **리플렉션은 컴파일 된 이후 런타임 시점에 이 JVM 내의 메모리 영역에 저장된 클래스 객체 정보들을 꺼내온 뒤, 그 중 우리에게 필요한 상세 정보들(생성자, 필드, 메소드 등)을 추출하여 사용할 수 있게 해주는 기술**이다. 즉, 리플렉션을 사용하면 특정 클래스에 대한 생성자, 메소드, 필드 등의 아주 상세한 정보들을 알아낼 수 있다. 

이는 다시말해, 객체의 타입을 컴파일 시점 전까진 몰라도 동적으로 객체를 생성할 수 있게 해주기도 한다. 이 장점을 살려서 프레임워크나 라이브러리가 내부적으로 리플렉션을 매우 유용하게 사용하고 있다. 우리가 직접 코딩을 할때는 객체의 타입을 모르는 일이 거의 없는 반면에, 프레임워크나 라이브러리는 컴파일을 돌리기 전까진 객체의 타입을 알 수 없다. 이런 문제를 해결하기 위해 리플렉션을 사용한다. 리플렉션을 사용하면 프레임워크나 라이브러리 입장에서 컴파일 되기 전 시점에 객체의 타입을 몰라도 전혀 무관하며, 런타임 시점에 동적으로 객체의 타입을 읽어올 수 있기 때문이다.

## 리플렉션의 유용한 실제 활용 사례

리플렉션은 실제로 많은 프레임워크와 라이브러리에서 활용되고 있다. 어떤 부분에서 실제로 사용되고 있을까?

### 리플렉션과 기본 생성자

JPA 엔티티에서도, 단순한 DTO 에서도 모두 기본 생성자를 항상 필수로 생성할 것을 요구한다. 이렇게 기본 생성자를 필수로 생성해야하는 이유는 리플렉션 때문이다. 왜 리플렉션 떄문일까?

~~~java
public class Member {
    // ...
    public Member(final String name) {
        this.name = name;
    }

    public Member(final String name, final String email) {
        this.name = name;
        this.email = email;
    }

    public Member(final String name, final String email, final String url) {
        this.name = name;
        this.email = email;
        this.url = url;
    }
}
~~~

만약 위처럼 기본 생성자가 없다면 생성자 종류가 많은 경우에 어떤 생성자를 선택해서 객체를 생성할지 프레임워크가 판단하기 어렵기 떄문이다. 또한 아래와 같이 파라미터의 타입이 같은 경우, 필드와 이름이 다르다면 값을 올바르게 넣어주기 힘들기 떄문이다. 

~~~java
public Member(final String name, final String email, final String url) {
    this.name = email;
    this.email = url
    this.url = name;
}
~~~

만약 기본 생성자를 사용한다면 위에서 언급한 문제점들을 제거할 수 있다. 리플렉션이 기본 생성자로 간단히 객체를 생성한 다음에, 필드 이름에 맞춰서 알맞은 값을 넣어주기만 하면 끝이다.

### 어노테이션의 동작 원리

`@Component`, `@Bean`, `@Service` 와 같은 어노테이션은 대표적으로 프레임워크에서 리플렉션을 사용한 사례이다. 만약 리플렉션이 없었다면, 어노테이션 그 자체로는 아무런 역할도 하지 못한다. 스프링 프레임워크는 내부적으로 리플렉션을 사용하여 어노테이션이 붙어있는 클래스(또는 메소드, 파라미터 등) 의 정보를 가져온다. 그 다음 후술할 `Class` 타입의 객체 메소드 중 `getAnnotation()`, `getDeclaredAnnotation()` 등을 호출하여 어떤 어노테이션이 붙어있는지를 확인하고, 그에 따른 로직을 수행한다.

## Class 클래스

앞서 설명했기를, 리플렉션을 사용하여 객체의 타입을 컴파일 시점 전까진 몰라도 동적으로 객체를 생성할 수 있게 해준다. 동적인 객체 타입을 수용할 수 있게 해주는 것이 바로 `Class` 클래스이다. 즉, `Class` 타입 객체를 선언하면 런타임 시점에 주입될 실제 객체 타입이 그 무엇이던간에 모두 생성할 수 있게된다. 

Class 타입의 객체를 통해 클래스에 붙은 어노테이션을 조회할 수 있고, 클래스가 가진 생성자나 필드, 메소드에 대한 정보를 조회할 수 있다. 심지어 클래스의 부모 클래스 또는 구현하고 있는 인터페이스까지 정보를 조회할 수 있다. 그리고 Class 타입 객체는 public 생성자가 존재하지 않고, JVM 에 의해 자동으로 객체가 생성된다.

### Class 객체 생성

그렇다면 Class 객체를 어떻게 생성할 수 있을까? 우선 `(1)` 클래스의 `.class` 속성을 통해 획득할 수 있다. 그리고 `(2)` 객체의 `getClass()` 메소드를 사용하는 방법도 있으며, `(3)` Class 클래스의 `forName()` 메소드에 패키지 경로를 전달하여 해당 경로에 대응하는 클래스에 대한 `Class` 타입의 객체를 얻을 수 있다.

~~~java
Class<Member> clazz1 = Member.class; // (1)

Member member1 = new Member();
Class<? extends Member> clazz2 = member1.getClass(); // (2)

Class<?> clazz3 = Class.forName("moheng.member.domain"); // (3)
~~~

### getXXX(), getDelaredXXX()

Class 객체의 메소드는 크게 `getFields()`, `getMethods()`, `getAnnotations()` 와 같은 형태와 `getDeclaredFields()`, `getDelcaredMethods()`, `getDeclaredAnnotations()` 와 같은 형태 2가지로 메소드가 정의되어 있다. 이 메소드들은 클래스에 정의된 필드, 메소드, 어노테이션 목록을 가져오기 위해 사용된다.

`getXXX()` 형태의 메소드는 **상속받은 클래스와 인터페이스를 포함하여 모든 public 요소를 가져온다.** 예를들어 `getAnnotations()` 는 파라미터로 넣어준 클래스 타입이 붙어있는 모든 어노테이션을 가져온다. `getMethods()` 는 파라미터로 넘겨준 클래스가 상속받은, 그리고 구현한 인터페이스에 대한 모든 public 메소드를 가져온다.

반면 `getDeclaredXXX()` 형태의 메소드는 상속받은 클래스와 인터페이스를 제외하고 해당 클래스에 직접 정의된 내용만 가져온다. 또한 접근 제어자와 무관하게 요소에 접근한다. 예를들어 `getDelcaredMethods()` 는 해당 클래스에만 직접 정의된 private, protected, public 메소드를 모두 가져온다.

## 어노테이션 가져오기

앞서 게속 설명했듯이, 스프링은 리플렉션을 사용하여 어노테이션이 붙어있는 클래스(또는 메소드, 파라미터 등) 의 정보를 Clsss 타입의 객체로 가져온다. 이후 `getAnnotation()`, `getDeclaredAnnotation()` 등을 호출하여 어떤 어노테이션이 붙어있는지를 확인하고, 그에 따른 로직을 수행한다.

~~~java
Class<Member> member = Member.class;
Entity entityAnnotation = member.getAnnotation(Entity.class); // @Entity 어노테이션을 가져옴
String value = entityAnnotation.value();
System.out.println("value = " + value); 
~~~

`getAnnotation()` 은 위와 같이 사용할 수 있다. 위처럼 메소드에 직접 어노테이션 타입을 넣어주면, 클래스에 붙어있는 어노테이션을 가져올 수 있다. 또한 어노테이션이 가지고 있는 필드에도 접근할 수 있는 것을 볼 수 있다.

Class 를 사용하면 어노테이션 외에도 생성자를 `Constructor` 타입으로 가져올 수 있고, 객체 필드를 `Field` 로 접근할 수 있으며, 객체 메소드를 `Method` 타입으로 접근할 수 있다. 자세한 설명은 생략한다.

## EntityManager 와 리플렉션을 활용하기

[격리된 테스트(Isolated Test) 구축과 빌드 최적화 여정 - 실전편](https://haon.blog/test/isolated-active/) 에서 다루었듯이, 테스트 격리 환경에서 자바 리플렉션을 사용했던 경험이 있다. 각 테스트가 실행되기 직전에 호출되어 DB를 초기 상태로 만들어주는 DB Cleaner 에서 리플렉션이 사용되었다.

~~~java
@Component
public class DatabaseCleaner {
    private EntityManager entityManager;
    private List<String> tableNames;

    public DatabaseCleaner(final EntityManager entityManager) {
        this.entityManager = entityManager;
        this.tableNames = entityManager.getMetamodel()
                .getEntities()
                .stream()
                .map(Type::getJavaType)
                .map(javaType -> javaType.getAnnotation(Table.class))
                .map(Table::name)
                .collect(Collectors.toList());
    }

    @Transactional
    public void clear() {
        entityManager.flush();
        entityManager.createNativeQuery("SET foreign_key_checks = 0").executeUpdate();

        for (String tableName : tableNames) {
            entityManager.createNativeQuery("TRUNCATE TABLE " + tableName).executeUpdate();
        }

        entityManager.createNativeQuery("SET foreign_key_checks = 1").executeUpdate();
    }
}
~~~

이 DB Cleaner 는 EntityManager 를 통해 모든 Entity 를 가져오고, 자바 리플렉션을 통해 Entity 의 `@Table` 어노테이션이 달린 클래스의 테이블 명을 가져오는 방식으로 동작한다. 보듯이 `getEntities()` 로 모든 엔티티를 가져왔으며, `getAnnotation()` 을 통해 `@Table` 어노테이션이 달린 각 Table 어노테이션 객체들에 대해 name (테이블 명)을 추출하고 있다. 그렇게 가져온 테이블 명 리스트를 활용하여 TRUNATE TABLE 쿼리를 날려서 깨끗하게 데이터베이스를 초기화한다.

## 리플렉션의 단점

리플렉션을 사용시 많은 단점을 가지고 있기 떄문에, 일반적인 상황에서 사용할 일이 거의 없다. 일반적으로 메소드를 호출하면, 컴파일 시점에 분석된 클래스를 사용하지만 리플렉션은 런타임 시점에 클래스를 분석하므로 속도가 매우 느리다. 또한 타입 체크가 컴파일 타이밍에 불가능하여 애플리케이션의 신뢰도를 깨뜨릴 원인이 될 수 있다. 그리고 객체의 추상화가 깨진다는 점도 존재한다.

보통 리플렉션은 라이브러리나 프레임워크를 개발할 때 사용된다. 따라서 정말 필요한 곳에만 리플렉션을 한정적으로 사용하도록 하자.

## 참고

- https://www.youtube.com/watch?v=67YdHbPZJn4
- https://www.youtube.com/watch?v=RZB7_6sAtC4&t=197s
- https://hamait.tistory.com/317