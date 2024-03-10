---
title: 자바의 멤버 클래스는 되도록 static을 붙여서 정적 멤버 클래스로 만들어라
date: "2023-08-29"
tags:
  - JAVA
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 중첩 클래스

중첩 클래스(Nested Class) 란 다른 클래스 안에 정의된 클래스로써 내부 클래스(inner class) 라고도 불립니다. **중첩 클래스는 자신을 감싼 외부 클래스에서만 쓰여야하며,** 그 이외에 쓰임세가 있다면 탑레밸 클래스로 만들어야 합니다.

중첩 클래스의 종류에는 `정적 멤버 클래스`, `(비정적) 맴버 클래스`, `익명 클래스`, `지역 클래스` 이렇게 4가지가 해당합니다. 이 중에서 정적 멤버 클래스를 제외한 모든 클래스는 내부 클래스(inner class) 에 해당합니다. 이들중에 익명 클래스를 제외한 모든 클래스에 대한 특징을 파악하고, 언제 왜 사용해야하는지를 학습하는 것이 이번 포스팅의 핵심 취지가 될 것입니다.

### 정적 멤버 클래스

```java
public class MyClass {
  private Integer myNumber;

  public static class MyInnerClass {
    public void method(MyClass myclass){
      Integer number = myClass.myNumber;
    }
  }
}

// 일반 클래스처럼 사용 가능하다.
MyInnerClass instance = new MyClass.MyInnerClass();
```

클래스으 정적 멤버 필드처럼 정적(static) 으로 정의된 멤버 클래스를 정적 멤버 클래스라고 합니다. 위를보면 MyClass 내부에 MyInnerClass 가 정의되어 있습니다. 이 클래스는 일반적인 클래스와 같이 `new` 키워드를 통해 객체를 생성할 수 있고, 필드를 가지며 메소드를 작성할 수 있습니다. 하지만 자신을 감싼 외부 클래스와 private 필드에 접근 가능하다는 것이 일반 클래스와 다릅니다.

```java
public class Calculator {
  public static enum Operator {
    PLUS, MINUS, DIVIDE, MULTIPLY;
  }
  // ...
}
```

Calculator 클래스 내부의 Operator 열겨형은 Calculator.Operator.PLUS 와 같이 계산 유형을 선택하는 역학을 합니다. 여기서 Operatro 는 오로지 Calculator 클래스 내부에서만 사용되기 때문에 새로운 탑레벨 클래스를 만들지 않고 내부의 중첩 클래스로 정의했습니다.

### 비정적(non-static) 멤버 클래스

```java
public class Machine {
  private String status;

  public class Button {
    public void click(){
      String status = Machine.this.status;
    }
  }
}
```

(비정적) 멤버 클래스는 정적 멤버 클래스와 달리 static 키워드를 사용하지 않고 정의합니다. 정의할때 키워드 하나 차이지만 큰 차이가 있습니다. 먼저 non-static (비정적) 클래스이기 때문에, **객체를 만들기 위해서는 먼저 감싸는 외부 클래스의 인스턴스가 존재해야합니다.** 이 말은 즉슨, 생성되는 멤버 클래스의 객체는 외부 클래스의 인스턴스와 연결되어 있다는 뜻입니다. 예를들어 위처럼 Machine.this.status 와 같이 외부 클래스의 인스턴스에 접근해서 멤버 변수를 가져올 수 있습니다.

---

## 비정적 클래스의 사용을 지양하자.

### 1. 외부 클래스 인스턴스가 있어야지 사용 가능하다

(비정적) 멤버 클래스는 외부 클래스와 인스턴스로 연결된다는 특성 때문에 사용이 지양됩니다. **멤버 클래스는 먼저 외부 클래스와 인스턴스가 있어야 클래스를 사용할 수 있습니다.** 또한 이는 일반적인 클래스와 사용이 다르기 떄문에 사용이 불편합니다.

### 2. 메모리 사용량이 많아진다

또 멤버 클래스와 외부 클래스와 인스턴스의 연결 정보를 가지고 있어야하기 때문에 **사용되는 메모리가 많습니다.** 따라서 상위 클래스의 인스턴스에 연결이 필요한 특수한 경우가 아니라면, 멤버클래스에는 static 키워드를 사용하여 정적으로 만드는것이 권장됩니다.

---

### 지역 클래스

```java
public class MainClass {
  public static void method() {
    // 지역클래스 선언
    class MyLocalClass {
      // ...
    }
    // 지역 클래스 인스턴스 생성
    MyLocalClass instance = new MyLocalClass();
  }

  public static void main(String[] args){
  	// 컴파일 에러 발생
    MyLocalClass instance = new MyLocalClass();
  }
}
```

정적 및 비정적 멤버 클래스에 이어서, 추가적으로 지역 클래스에 대해서도 알아봅시다. 지역 클래스는 일반 클래스와 유사하게 사용할 수 있지만, **클래스의 타입을 사용할 수 있는 범위가 클래스가 정의된 지역을 벗어날 수 없습니다.**

위 예제를 보면, method() 에서 MyLocalClass 가 정의 되었고 new 키워드를 통해 인스턴스를 만들었습니다. 이처럼 일반 클래스와 유사하게 정의하고 사용 가능합니다. 하지만 main 메소드에서 MyLocalClass 타입을 사용하려고 하면 MyLocalClass 는 method() 에서 정의된 지역 클래스이기 때문에 method() 를 벗어나서는 사용 불가능하므로 컴파일 에러가 발생합니다.

---

## 정리

중첩 클래스에는 4가지가 있으며, 각각은 쓰임이 다릅니다. 메소드 밖에서도 사용해야 하거나 메소드 안에 정의하기엔 너무 길다면 멤버 클래스로 만듭시다. 멤버 클래스의 인스턴스 각강이 바깥 인스턴스를 참조한다면 비정적으로, 그렇지않다면 정적으로 만듭시다.
