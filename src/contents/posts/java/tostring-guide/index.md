---
title: 자바의 toString 메소드를 올바르게 활용하는 방법에 대하여
date: "2023-09-04"
tags:
  - JAVA
  - tostring
previewImage: java.png
---

## 학습동기

왜 toString 을 활용해서 코드를 작성하는지 잘 이해하지 못해서 사용하지 않고 있었는데, 이번 기회에 왜 toString 을 활용하는 것인지에 대해 알고자 이렇게 학습을 하게 되었습니다.

---

## toString

toStrng 일반 규약에 따르면, **"간결하면서 사람이 읽기 쉬운 형태의 유익한 정보를 반환해야 한다"** 라고 정의하고 있습니다. 또 규약에 따르면 "toString 을 잘 구현한 클래스는 사용하기가 매우 편해지며, 그 클래스 활용했을 때 **"디버깅"** 하기 쉽다는 특징을 지니고 있다고합니다.

### Object.toString

대부분의 클래스는 기본적으로 `Object` 클래스의 메소드를 재정의하여, 원하는 형식대로 사용하는 구조를 가집니다. 개발자가 별도의 재정의를 하지 않았다면 기본적으로 `클래스명@16진수로_표시한_해시코드` 형식을 반환하게 됩니다.

```java
System.out.println(book1); // Book@adbbd
System.out.println(book1.toString());
```

하지만 Object 에서 반환하는 포맷은 읽기도 힘들며, 의미있는 정보가 아닙니다. 때문에 추후 디버깅 용도로 활용하지도 못하게 될겁니다. 이 때문에 서적에서는 **"toString 을 항상 재정의하라"** 는 합니다.

---

## toString 을 항상 재정의하라

위와 같은 `Object` 클래스의 toString 의 단점을 이해했다면, 왜 toString 을 재정의하라는 것인지 충분히 납득됐을겁니다. 앞서 언급했듯이, **toString 을 잘 구현한 클래스는 사용하기 편하며 디버깅하도 쉽습니다.** toString 메소드는 객체를 print, 문자열 연결 연산자인 "+", assert 구문에 넘길때, 디버깅을 객체를 출력할 때 등의 상황에서 자동으로 호출됩니다.

toString 은 그 객체가 가진 모든 주요정보를 반환하는게 좋습니다. 예를들어 아래와 같이 name, price 라는 주요 필드가 있고 그 외에 상대적으로 중요도가 떨어지는 기타 필드들이 있다면, toString 출력 형식을 주요 필드들로 구성하여 출력해줄 수 있습니다.

```java
class Book {
  private String name;
  private int price;
  // ... (기타 컬럼)

  // (생성자 정의부 생략)
  @Override
  public String toString(){
    return String.format("책 (이름 = %s, 가격 = %s", name, price);
  }
}
```

단, `정적 유틸리티 클래스` 와 대부분의 `열거타입` 은 toString 을 제공할 필요가 없습니다. 해당 타입들은 이미 자바에서 완벽한 toString 형식을 제공하기 때문입니다.

### 활용방안

toString 은 계속 언급했던 맥락이지만, **디버깅을 위해 설계된 메소드**라고 합니다. 어떤 문제가 발생한 클래스에 대해 toString 이 잘 정의되었다면, 스스로 본인에게 무슨 문제가 발생했는지를 명쾌하게 설명해줌으로써 유익한 정보를 제공받을 수 있게됩니다. 때문에 개발자는 무엇이 원인인지를 더 쉽게 찾을 수 있게 됩니다.

toString 은 디버깅이 주목적이 되므로, 보통 클라이언트에게 보여줄 출력을 위한 메소드는 별도로 정의하는 방안이 좋을 수 있습니다.

---

## 참고

- Effective Java (Joshua Bloch 지음)
- https://hudi.blog/java-correct-purpose-of-tostring/
