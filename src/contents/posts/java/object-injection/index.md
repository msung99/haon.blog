---
title: 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라 (feat. 싱글톤)
date: "2023-08-29"
tags:
  - JAVA
  - 싱글톤
previewImage: java.png
---

## 학습배경

순수 POJO 로 돌아가서, 싱글톤의 원초적인 개념부터 다시 살펴보며 학습해보고자 합니다.

## 싱글톤(Singleton)

싱글톤(Singleton) 이란 인스턴스를 오직 하나만 생성할 수 있는 클래스를 말합니다. `(1)` 프로그램 내에서 하나의 객체만 존재하며, `(2)` 프로그램 내의 여러 부분에서 해당 객체를 공유해서 사용해야할 때 활용하는 패턴입니다. 그런데 **클래스를 싱글톤으로 만들면, 이를 사용하는 클라이언트를 테스트하기 어려워질 수 있습니다.** 타입을 인터페이스로 정의한 다음 그 인터페이스를 구현해서 만든 싱글톤이 아니라면 싱글톤 인스턴스를 가짜(Mock) 구현으로 대체할 수 없기 떄문입니다.

싱글톤을 만드는 방식은 아래와 같은 2가지 방식이 존재합니다.

### 생성방법1. public static final 필드와 private 생성자

`private 생성자`는 `public static final 필드`인 instance 를 초기화할 때 딱 한번만 호출됩니다. public 이나 proteted 생성자가 없으므로 User 클래스가 초기화될 때 만들어진 인스턴스가 전체 시스템에서 하나뿐임이 보장됩니다.

```java
public class Book {
  public static final User instance = new Book();

  private Book(){
  	// ...
  }

  public void printBookInfo(){
    // ...
  }
}
```

### 생성방법2. 정적 팩토리 메소드로 public static 멤버로 제공하는 방식

정적 팩토리 메소드를 통해 public static 멤버를 제공하는 방식도 싱글톤을 보장합니다. 아래의 `instance` 의 경우, `getInstance()` 로 항상 같은 객체의 참조를 반환하므로 싱글톤이 보장됩니다. 여기서도 마찬가지로 `private 생성자` 가 호출되므로 외부에서 신규 객체가 생성되는 상황을 방지할 수 있게됩니다.

```java
public class Book {
	private static final Book instance = new Book();

    private Book(){
      // ...
    }

    public static Book getInstance(){
      return instance;
   }

   public void printBookInfo(){
   	 // ...
   }
}
```

### private 생성자

여기서 둘의 공통점이자 핵심은 바로 "private 생성자" 입니다. 생성자를 private 로 생성함으로써 외부에서 새로운 객체의 생성을 방지할 수 있게됩니다.

```java
Book book1 = Book.getInstance();
Book book2 = Book.getInstance();

System.out.println(book1);// book1, book2 는 같은 인스턴스이므로 같은 주소값 반환
System.out.println(book2);
```

지금껏 싱글톤(Singleton) 이 무엇인지를 알아봤으며, 어떤 전략으로 패턴을 생성하는지에 대해 알아봤습니다. 이제부턴 위와같은 싱글톤 및 정적 유틸리티 클래스 방식보다 더 나은 방식을 알아봅시다.

---

## 싱글톤이 잘못 사용된 경우

많은 클래스들은 상위-하위 관계로 많은 관계에 의존합니다. 예를들어 아래와 같은 번역기(Translator) 클래스는 백과사전(dictionary) 에 의존하는데, 이런 클래스르 싱글톤으로 구현할 수 있을겁니다. 번역기는 "한국어" 백과사전이라는 특정 백과사전 구현체에만 의존 가능한 형태입니다.

```java
public class Translator {
	private final Dictionary dictionary = new Korean();

    private Translator(){
       // ...
    }
    // ... (추가구현)
}
```

이런 싱글톤 방식은 백과사전을 단 하나만 사용한다고 가정한다는 점에서 썩 좋지 못합니다. 만약 애플리케이션 상황에 따라 Korean 이 아니라 America 백과사전로 갈아끼워야 하는 상황에서는 난처해질 것입니다. 결국 사전 하나로 모든 케이스에 대해 대응할 수 있다는 사고방식은 확장성에 있어 좋지 못합니다.

필드에서 final 키워드를 제거하고 다른 사전으로 교체하는 신규 메소드를 추가한다면 쉽겠지만, 이 방식은 어색하며 멀티쓰레드 환경에서 사용 불가능합니다. 결론적으로, **사용하는 자원에 따라 동작이 달라지는 클래스에 싱글톤 패턴을 적용하는 것은 적합하지 않습니다.** 이는 `SOLID` 를 위반하는 행위이기도 합니다.

---

## 생성자에 필요한 자원을 파라미터로 넘겨주자

클래스가 여러 자원 타입에 대한 인스턴스를 유동적으로 지원해야하기 위해선, **객체를 생성할 때 생성자에 필요한 자원을 파라미터로 넘겨주는 방식** 으로 해결 가능합니다. `의존 객체 주입의` 한 형태로, 예시의 경우는 생성자에다 백과사전 객체를 파라미터로 주입해주면 됩니다.

```java
public class Translator {
	private final Dictionary dictionary;

    private Translator(Dictionary dictionary){
       this.dictionary = Objects.requireNonNull(dictionary);
    }
    // ... (추가구현)
}
```

위 예시는 dictionary 라는 딱 하나의 자원만 사용하지만, 자원이 몇개든 의존관계가 어떻든간에 상관없이 잘 작동합니다. 또한 불변을 보장하므로, 같은 자원을 사용하려는 여러 클라이언트가 의존 객체들을 안심하고 공유할 수도 있습니다.

여기서 중요한건 Translator 생성자의 매개변수인 dictionary의 타입이 구체 클래스가 아닌 인터페이스여야 의미가 있다는 것입니다. 만약 의존관계가 구체타입으로 주입이 된다면, 우리는 사전 종류를 바꾸기 위해 결국 클라이언트 코드를 변경해야 합니다. 인터페이스로 들어왔을때 클라이언트는 dictionary의 종류에 상관없이 내부 로직을 진행 할 수 있을 것이겠죠. 이는 객체지향의 원칙 중 다형성을 구현한 것이라 할 수 있습니다.

### 장점

생성자의 파라미터를 통한 의존성 주입을 활용시 다음과 같은 이점을 얻을 수 있습니다.

- 같은 자원을 사용하려는 여러 클라이언트가 의존 객체들을 안심하고 공유할 수 있다.
- 정적 팩토리, 빌더 모두에 동일하게 적용 가능하다.
- 클래스의 테스트, 유연성, 재사용성등을 개선해준다.

---

## 참고

- Effective Java (Joshua Bloch 지음)
- https://nankisu.tistory.com/91
- https://velog.io/@seongwon97/싱글톤Singleton-패턴이란
- https://devjem.tistory.com/62
- https://rutgo.tistory.com/517
