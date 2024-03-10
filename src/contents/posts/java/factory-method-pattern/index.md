---
title: 팩토리 메소드 패턴 (Factory Method Pattern)
date: "2023-09-04"
tags:
  - JAVA
  - 디자인패턴
previewImage: java.png
---

## 팩토리 메소드 패턴

팩토리 메소드 패턴은 **객체의 생성 코드를 별도의 클래스 및 메소드로 분리**함으로써 객체 생성의 변화에 대비하는데 유용합니다. **상황에 따라 다양한 타입의 적절한 객체를 생성하는 코드가 중복되는 것이 많을 때** 사용하기 매우 유용합니다. 객체 생성 코드를 따로 분리한다면, 요구사항 및 여러 분기처리에 따라 다양한 타입의 객체를 생성해야하는 경우에 효과적으로 대응할 수 있게 됩니다.

### 구성 방법

인스턴스 생성을 서브 클래스에게 위임하고, 부모 추상 클래스는 인터페이스에만 의존하고 실제로 어떤 구현 클래스를 호출할지는 서브 클래스에서 구현합니다. 이렇게하면 새로운 구현 클래스가 추가되어도 기존 팩토리 코드의 수정없이 새로운 팩토리를 추가하면 됩니다. 이때 팩토리란, 구체 타입의 객체를 생성해주는 역할을 담당하는 추상 클래스를 말합니다.

---

## 팩토리 메소드 적용

![](https://velog.velcdn.com/images/msung99/post/a3cf24cf-ced6-451e-894a-66e32d999502/image.png)

지금부터 적용해볼 상황은 위와 같습니다. 클라이언트는 선호에 따라 다양한 종류의 책을 구매할 원합니다. 이를위해 클라이언트는 추상 메소드 `BookFactory` 에만 의존하고 있으며, 상황에 따라 적절한 Book 타입의 객체를 생성해줄 팩토리를 활용하여 객체를 생성받게 됩니다.

각 팩토리 구현체는 객체를 생성하는 메소드 `createBook()` 만을 구현하면 됩니다.

### 팩토리 추상 클래스

클라이언트가 의존하게 될 부모 클래스는 `abstract` 를 활용하여 추상 클래스로 정의해줬습니다. 특히 `createBook()` 를 보면 추상 메소드임을 알 수 있는데, 이로써 BookFactory 를 상속하는 각 팩토리 구현 클래스들은 각자의 책임에 알맞게 적절한 타입의 객체를 생성하는 코드를 구성하면 됩니다.

```java
public abstract class BookFactory {
    public Book newInstance(){
        Book book = createBook();
        book.buyBook();
        return book;
    }

    protected abstract Book createBook();
}
```

### 팩토리 구체 클래스

각 팩토리 클래스는 본인의 역할에 알맞는 타입의 객체를 생성하는 모습을 확인할 수 있습니다.

```java
public class EssayFactory extends BookFactory{
    @Override
    protected Book createBook(){
        return new Essay();
    }
}

public class DiaryFactory extends BookFactory{
    @Override
    protected Book createBook(){
        return new Diary();
    }
}
```

### 객체 인터페이스 및 구현체

여러 타입의 객체를 생성하는 것을 대표할 추상 클래스인 BookFactory 는, 본인이 생성할 객체가 구체 타입에 의존해선 안됩니다. 때문에 객체는 추상화된 인터페이스로 정의되어있으며, BookFactory 는 이 인터페이스만을 의존하게되는 형태입니다. 그러고 Book 을 구현하고 있는 구체타입에 객체에 대해 각각의 팩토리 구현 클래스 (EssayFactory, DiraryFactory) 들이 생성하는 형태입니다.

```java
public interface Book {
    void buyBook();
}

public class Essay implements Book {
    @Override
    public void buyBook() {
        System.out.println("소설책을 구매합니다.");
    }
}
```

---

## 언제 사용하면 좋을까?

이런 팩토리 메소드 패턴의 특징을 고려했을 때, 다음과 같은 상황에 활용하면 좋을겁니다. 우선 작성한 코드가 함께 작동해야하는 객체들의 정확한 유형들과 의존관계를 미리 모르는 경우가 사용하면 좋을겁니다. 필요에 따라서 얼마든지 객체 생성을 기존 코드의 수정없이 마음껏 확장 가능하기 때문이겠죠. 이로싸 앞서 언급했듯이, 객체의 생성 코드를 별도의 클래스/메서드로 분리함으로써 객체 생성의 변화에 대비하는 데 유용할겁니다.

비슷한 맥락으로, 상황에 따라 적절한 객체를 생성하는 코드가 자주 중복될 것 같을때 활용하면 됩니다. 이는 앞선 내용들을 이해했다면 무슨 의미인지 이해하실겁니다.

---

## 참고

- https://bcp0109.tistory.com/367
- https://refactoring.guru/ko/design-patterns/factory-method
- https://gmlwjd9405.github.io/2018/08/07/factory-method-pattern.html
