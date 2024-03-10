---
title: Object.equals의 일반 규약을 지켜서 재정의하라
date: "2023-09-04"
tags:
  - JAVA
  - equals
previewImage: java.png
---

## 학습베경

equals() 를 공부했었지만, 간혹 필요에 따라 재정의를 해줄때가 있었습니다. 하지만 깊은 이해 없이 사용하다보니, 어떻게 정의를 하는것이 좋으며, 컴파일 및 문법상의 에러는 없는것인지 항상 고민이 따랐는데, 이번 기회에 제대로 학습해본 후에 적용해보고자 합니다.

## Object.equals

일반적으로 활용했던 `equals()` 를 떠올렸을땐, 동등성 비교를 위해 "String" 과 같은 레퍼 클래스에서 많이 사용해봤을 겁니다. 하지만 주의해야 할 점은 `Obects.equals()` 과 `String.equals()` 는 엄연히 다른것임 동작 방식도 큰 차이를 보입니다.

```java
// Object.class
public boolean equals(Object obj) {
	return this == obj;
}
```

Object 클래스에서 정의하고 있는 `equals()` 정의부는 위와 같습니다. `==` 비교를 통해 두 객체를 비교하고 있는 모습으로, `주소값 비교` 를 수행하는 것입니다.

```java
class EqualTest {
    class Book  {
        private final String bookName;
        private final int year;

        Book(String bookName, int year) {
            this.bookName = bookName;
            this.year = year;
        }
    }

    @Test
    void 동등성을_테스트한다() {
        Book book1 = new Book("my-book", 2023);
        Book book2 = new Book("my-book", 2023);
        Assertions.assertTrue(book1.equals(book2)); // 테스트 실패
    }
}
```

때문에, 위와 같은 사용자 정의 클래스를 정의후 동등성을 비교했을때 테스트에 실패하게 됩니다. 기본적으로 사용자 정의 클래스는 `Object` 를 상속하고 있으며, 때문에 equals() 를 호출시 `Object.equals()` 가 호출되므로 "주소값 비교" 가 수행될 것이고, 두 객체의 주소값은 다르기 때문에 비교결과가 false 로 출력됩니다. 즉, 같은 값을 가진 객체더라도 따로 생성됐다면 다른 객체로 인식되는 것입니다.

### String.equals

```java
String str1 = new String("test");
String str2 = new String("test");
System.out.println(str1.equals(str2)); // true
```

반면 값 클래스(String, Integer, ..) 들은 Object.equals() 를 재정의하여 사용하도록 구현되어 있기 때문에 동작방식의 차이를 보입니다. String 을 사용할때 자주 경험했겠지만, equals() 는 주소값이 다름에도 **내부 값이 동일하다면 결과가 true** 이라는 반대의 특징을 지니고 있습니다.

정리하자면, **모든 클래스는 Object의 equals 를 상속 받고 있고, String 을 비롯한 값 클래스들은 Object의 equals를 재정의 했다고 할수 있습니다.**

---

## equals() 를 재정의하지 않는게 좋은 경우

Object 클래스의 `equals()` 는 객체의 동일성을 비교하는 공통 메소드라고 할 수 있습니다. 개발자가 필요에 따라서 equals 를 재정의 할 수 있을텐데, 무턱데고 정의하다가 예기치 못한 문제가 발생할 수 있으므로, 아래의 경우중 하나라도 해당한다면 메소드를 재정의 하지 않는것이 좋습니다.

### 1. 논리적 동일성을 검증할 필요가 없다.

**equals() 메소드는 논리적 동일성을 검사하는 메소드입니다.** 때문에 논리적 동일성을 검삭할 필요가 없다면, equals() 를 재정의할 필요가 없습니다. 예를들어 java.utils 의 두 `Pattern` 클래스 타입의 인스턴스는 정규표현식을 나타내는지를 검사하는, 즉 논리적 동치성을 검사하는 방법이 있습니다. 이 클래스의 경우는 이미 equals() 없이도 논리적 동일성을 검사할 필요가 없으므로, equals() 를 재정의할 필요가 없습니다.

### 2. 상위 클래스에서 재정의한 equals 는 하위 클래스에서도 그대로 사용 가능하다.

**equals 메소드는 Object 클래스에서부터 정의되어있고, 상위 클래스부터 하위 클래스까지 상속됩니다.** 따라서 상위 클래스에서 정의한 equals 를 하위 클래스에서도 그대로 활용해도 문제 없다면, 이 메소드를 재정의할 필요가 없습니다.

```java
class Parent{
   // ...
   @Override
   public boolean equals(Object o){
       // ... (1)
	}
}

class Child extends Parent{
	// ... 부모의 (1) 에서 재정의한 equals() 내용이 그대로 상속된다.
}
```

---

## 양질의 equals 메소드 구현방법

올바른 equals() 를 구현하기 위한 방법은 아래와 같습니다.

```java
@Override
public boolean equals(Object o){
  if(o == this) // (1)
    return true;

  if(!o instanceof (Book)o; // (2)
    return false;

  Book book = (Book)o;
  return (book.name == this.name) && (book.year == this.year);
}
```

### 1. == 연산자를 활용하여 입력이 자기 자신인지 확인한다.

`(1)` 에 해당하는 내용으로, 입력받은 인스턴스가 자기 자신이라면 true 를 반환하는 로직을 작성해주면 됩니다. 이는 단순한 성능 최적화 용도로, 비교적 작업이 복잡한 상황일 때 값어치를 합니다.

### 2. instaneof 연산자로 입력이 올바른 타입인지 확인한다.

`(2)` 에 해당하는 내용으로, `instanceof` 연산자로 입력이 올바른 타입인지 확인하고, 그렇지 않다면 false 를 반환하는 로직을 작성해줍시다. 이때 올바른 타입이란 equals 가 정의된 클래스(위의 경우는 Book) 인 것이 보통이지만, 가끔은 그 클래스가 구현한 특정 인터페이스가 될 수도 있습니다. 어떤 인터페이스는 상황에 따라 자신을 구현한 (서로 다른) 클래스끼리도 비교할 수 있도록 equals 규약을 수정하기도 합니다.

### 3. 입력을 올바른 타입으로 형변환한다.

`(2)` 에서 instanceof 검사를 했기 때문에, 위 예제에서 이 단계는 문제없이 성공합니다.

### 4. 타입의 비교에 필요한 핵심필드를 모두 비교한다.

입력 객체와 자기 자신이 대응되는 "핵심" 필드들이 모두 일치하는지 하나씩 검사하도록 구현합시다. 모든 필드가 일치하면 true 를, 하나라도 다르면 false 를 반환하면 됩니다. 위 경우는 Book 클래스의 멤버 필드중에 name 와 year 를 모두 비교했습니다.

또한 너무 복잡하게 필드들을 비교할 필요도 없습니다. 필드들의 동치성만 검사해도, equals 재정의가 원활하게 이루어진 것입니다.

### 6. Object 외의 타입을 매개변수로 받지말자.

```java
public boolean equals(Book o){ // (1)
  // ...
}

@Override
public boolean equals(Book o){ // (2)
  // ...
}
```

`Object` 타입 외의 타입을 매개변수로 받는 equals() 메소드는 선언하지 않는게 좋습니다. 예를들어 위와 같은 경우가 많은 개발자들이 자주 범하는 실수라고 하는데, 두 케이스 모두 입력타입이 Object 가 아니므로 Object 클래스의 equals 를 재정의한게 아니라, `다중상속` 한 것입니다.

`(1)` 의 경우 Object.equals 를 재정의한 것이 아님에도, 하위 클래스에서의 `@Override` 가 Object.equals 를 재정의한것을 올바르게 상속 받았다고 잘못 인식하게 되는 "긍정 오류" 를 내게 됩니다.

그렇다고 `(2)` 의 경우도 올바른 정의 방법이 아닙니다. 재정의를 위해선 상위 클래스의 `매개변수 타입` 까지 모두 동일해야 재정의가 되는 것인데, Object.equals 의 매개변수 타입은 "Object" 이고, 위 경우는 구체 클래스인 Book 타입이므로 재정의가 불가능하고 컴파일 에러가 발생합니다.

### 7. hashCode 도 함께 재정의하자.

이와 관련한 내용은 아직 잘 이해하지 못했으므로, 추후 포스팅에서 충분한 학습을 거친후에 다시 다루도록 하겠습니다.

---

## 정리

꼭 필요한 경우가 아니라면 equals 를 재정의하지 맙시다. 대다수의 경우에 Object 의 equals 는 저희가 원하는 비교를 정확히 수행해주기 때문입니다. 재정의가 필요할때는, 그 클래스의 핵심 필드를 모두 빠짐없이 앞서 언급한 사항들을 준수하면서 정의해주는게 좋습니다.

---

## 참고

- Effective Java (Joshua Bloch 지음)
- https://nankisu.tistory.com/99
- https://www.appletong.com/entry/JAVA-object-equals-String-equals-는-뭐가-다를까
- https://lcs1245.tistory.com/entry/Java-equals-총-정리-값-비교하기-Objectsequals
