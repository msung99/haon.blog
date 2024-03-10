---
title: 자바 Enum 타입, 그거 어떻게 사용하는건데 🤷‍♂️
date: "2023-08-30"
tags:
  - JAVA
  - enum
---

## 학습배경

열겨형을 활용하여 어떻게 상수관리 및 메소드 처리를 깔끔하게 처리할 수 있는지를 잘 모른다고 느꼈기때문에, 이를위해 이번 포스팅에서 열거 타입에 대해 자세히 다루어보고자 합니다.

---

## 열겨 타입 (Enum)

열겨형이란 서로 관련된 상수들을 편리하게 관리하기 위해 선언하는 것으로, 여러 상수를 정의할때 활용하면 유용합니다.

### 타입에 안전한 열겨형 (typesafe enum)

자바의 열겨형은 "타입에 안전한 열겨형" 이라서 **실제 값이 같아도 타입이 다르면 컴파일 에러가 발생합니다.** 이처럼 값뿐만 아니라 타입까지 체크하기 때문에 타입에 안전하다고 하는 것입니다

### 열거 타입 선언방법

정의는 간단합니다. enum 타입의 괄호 { } 안에 상수의 이름을 나열하기만 하면 됩니다.

```java
public enum Direction {
  EAST,
  SOUTH,
  WEST,
  NORTH
}
```

### 열거 타입 사용

열거 타입도 데이터 타입의 일종으로, 변수를 선언하고 대입할 수 있습니다. 또 열거타입은 `null` 을 지정할 수 있습니다. 열거타입 또한 "참조 타입" 이기 떄문입니다.

```java
Direction direction1 = Direction.EAST;
Direction direction2 = null;
```

### 열거타입 상수간의 비교

열겨형 상수간의 비교는 `==` 를 사용할 수 있습니다. equals() 가 아닌 "==" 로 비교 가능하다는 것은 그만큼 빠른 성능을 제공하는 얘기입니다. 그러나 "<", ">" 와 같은 비교연산자는 사용할 수 없고 `compareTo()` 는 사용 가능합니다. compareTo() 는 두 비교대상이 같으면 0, 왼쪽이 크다면 양수, 오른쪽이 크다면 음수를 반환합니다.

```java
Direction direction = Direction.EAST;
if(direction == Direction.EAST){
  // ...
} else if(direction.compareTo(Direction.WEST) > 0){
  // ...
}
```

---

## JVM 메모리에 올라간 열거타입

![](https://velog.velcdn.com/images/msung99/post/266d6b69-71e2-4c09-b331-ddfb79063488/image.png)

자바에서의 열거 타입은 일종의 클래스이며, 상수 하나당 인스턴스 객체를 각각 하나씩 만들어서 `public static final` 필드로 공개합니다. 또한 열거 타입의 인스턴스는 런타임에 단 한번만 실행됩니다. 이런 특징으로 [싱글톤](https://velog.io/@msung99/JAVA-%EC%9E%90%EC%9B%90%EC%9D%84-%EC%A7%81%EC%A0%91-%EB%AA%85%EC%8B%9C%ED%95%98%EC%A7%80-%EB%A7%90%EA%B3%A0-%EC%9D%98%EC%A1%B4-%EA%B0%9D%EC%B2%B4-%EC%A3%BC%EC%9E%85%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%98%EB%9D%BC-feat.-%EC%8B%B1%EA%B8%80%ED%86%A4) 을 보장할 때 사용되기도 합니다.

```java
Direction myDir = Direction.EAST;
```

JVM 의 메모리 영역을 크게 구분하면, **메소드 영역, 힙 영역, 스택 영역** 3가지로 나뉩니다. 이때, 메소드 영역에는 클래스와 변수 (static variable) 가 저장됩니다. 따라서 열거 타입 클래스가 이 메소드 영역에 올라가게 되고, 힙 영역에는 실제 객체(인스턴스) 가 올라갑니다. 또 스택 영역에는 열거 타입 변수가 생성되죠. 위처럼 열거 타입 변수 myDir 를 생성한다면 해당 변수는 스택 영역에 생성되며, 힙 영역의 EAST 객체를 참조하게 됩니다.

---

## Enum 메소드

모든 열겨형 타입은 컴파일 타임에 `Enum` 이라는 최상위 클래스를 상속합니다. 우리가 지금껏 사용할 수 있었던 Enum 타입의 메소드들은 Enum 의 메소드라고 할 수 있습니다.

### name

열거 객체(열겨형 상수)의 이름을 문자열로 반환합니다. 이때 name() 을 별도로 호출안해도 기본적으로 열거 객체를 출력하면 문자열 이름이 반환된다.

```java
enum Direction {EAST, WEST, SOUTH, NORTH};

Direction direction = Direction.EAST;
System.out.println(direction.name()); // EAST
System.out.println(direction); // EAST
```

### values

열겨형의 모든 열거 객체(상수)를 순서대로 배열에 담아 반환합니다.열거 타입의 모든 열거 객체를 순회할 떄 유용하게 사용됩니다.

```java
Direction[] dArr = Direction.values();

for(Direction d : dArr){
  System.out.println(d.name());
}
```

### valueOf

지정된 열겨형에서 name 과 일치하는 열거형 상수를 반환합니다. 외부에서 문자열을 입력받아서 열거 객체로 변환할 때 유용하게 사용됩니다.

```java
Direction direction = Direction.valueOf("EAST");
System.out.println(direction); // EAST

System.out.println(Direction.EAST == Direction.valueOf("EAST")); // true
```

### ordinal

열거 객체의 순번을 반환합니다. 이때 순번이란 열거 타입을 정의할때 명시된 순서로써 0부터 시작합니다. ordinal() 이 반환하는 숫자는 열겨형 상수의 값으로 사용하지 않는것디 좋다고합니다. 이 값은 내부적인 용도로만 사용되기 위한 것이기 떄문입니다.

```java
// EAST:0, WEST:1, SOUTH:2, NORTH:3

Direction direction = Direction.WEST;
System.out.println(direction.ordinal()); // 1
System.out.println(Direction.NORTH); // 3
```

### compareTo

앞서 설명드린 compareTo 메소드로, 두 열거 객체간의 순번을 비교하여 상대적 순번 차이를 반환하는 메소드입니다. 비교대상 열거 객체보다 순번이 빠르다면 음수가, 느리다면 양수가 반환됩니다.

```java
System.out.println(Direction.NORTH.compareTo(Direction.EAST)); // 양수
System.out.println(Direction.EAST.compareTo(Direction.NORTH)); // 음수
```

---

## 열겨형에 멤버 추가하기

열거형 상수의 값이 불연속적인 경우에는 아래처럼 열겨형 상수의 이름 옆에 원하는 값을 괄호 "( )" 와 함께 적어주면 됩니다. 또한 **열거형의 생성자는 제어자가 암묵적으로 private 입니다. 때문에 외부에서 열겨형 객체를 생성할 수 없습니다.**

```java
enum Direction {
  EAST(1, "E"), WEST(-10, "W"), SOUTH(324, "S"), NORTH(5, "N");

  private final int value;
  private final String symbol;

  // private 이 생략됨
  Direction(int value, String symbol){
    // ...
  }
}
```

---

## 참고

- 자바의 정석 (남궁성 지음)
- https://hudi.blog/java-enum/
- https://hyunndyblog.tistory.com/23
