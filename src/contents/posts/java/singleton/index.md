---
title: 자바의 싱글톤(SingleTon) 패턴 구현 방법 6가지, Bill Pugh Solution
date: "2023-09-12"
tags:
  - JAVA
  - 디자인패턴
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 학습배경

> 싱글톤에 대해 선수 학습한 경험이 있다. 이에 대한 내용은 [[JAVA] 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라 (feat. 싱글톤)](https://velog.io/@msung99/JAVA-%EC%9E%90%EC%9B%90%EC%9D%84-%EC%A7%81%EC%A0%91-%EB%AA%85%EC%8B%9C%ED%95%98%EC%A7%80-%EB%A7%90%EA%B3%A0-%EC%9D%98%EC%A1%B4-%EA%B0%9D%EC%B2%B4-%EC%A3%BC%EC%9E%85%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%98%EB%9D%BC-feat.-%EC%8B%B1%EA%B8%80%ED%86%A4) 을 참고하자.

이전에 싱글톤의 기본 지식을 다룬 이력이 있으며, 프리코스 문제 풀이에도 싱글톤을 구현한 경험이 있기 떄문에 기초적인 선수지식은 생략합니다.

---

## 싱글톤(SingleTon)

간단히만 복습겸 싱글톤을 사용하는 이유에 대해 되짚고 넘어가봅시다. 싱글톤을 적용한다면, `(1)` 고정된 메모리 영역을 가지고 하나의 인스턴스만 사용하기 떄문에 메모리 낭비를 방지할 수 있습니다. `(2)` 싱글톤 클래스의 인스턴스는 전역이기 떄문에, 다른 클래스의 인스턴스들이 데이터를 공유하기도 쉽습니다.

---

## 싱글톤 구현

싱글톤의 구현 방법은 정말 다양합니다. 이전부터 싱글톤의 단점을 보완하고자 여러 구현방식에 걸쳐서 발전해왔습니다.

### Eager initalization

가장 먼저 등장한 방식으로, `즉시 초기화(Eager initalization)` 방식이 있습니다. 싱글톤을 구현해본 사람이라면 다들 이 방식을 보편적으로 많이 사용해봤을 겁니다. 이 방식은 필드에 자기자신 타입의 인스턴스를 필드로써 하나 보유하고, 바로 초기화하는 방식입니다.

```java
public class MoveRepository {
    private static final MoveRepository instance = new MoveRepository();

    private MoveRepository() {
    }

    public static MoveRepository getInstance(){
        return instance;
    }
}
```

#### 장점

장점은 인스턴스 생성이 굉장히 빠르다는 것입니다.

#### 단점

생성한 인스턴스를 사용하는 일이 없더라도 프로그램을 실행하면 static 을 로딩하면서 바로 메모리 공간을 차지해버립니다. 즉, 클라이언트에서 이렇게 생성된 인스턴스를 사용하지 않더라도 인스턴스가 항상 무조건 생성되버리며, 무엇보다 **예외 처리를 할 수 있는 방법이 없습니다.**

---

### Static Block initalization

```java
public class MoveRepository {
    private static final MoveRepository instance;

    private MoveRepository() {
    }

    static {
      try {
        instance = new MoveRepository();
      } catch(Exception e){
        throw new RunTimeException("싱글톤 객체를 생성하는데 실패했습니다.");
      }
    }

    public static MoveRepository getInstance(){
        return instance;
    }
}
```

위 단점중에 "예외처리" 를 보완하고자, `static` 블록을 추가하고, 그 안에서 인스턴스 생성을 시도하면서 동시에 예외 처리를 넣는 방식이 등장했습니다. 이로써 인스턴스 생성시 즉시 예외처리가 가능해진다는 점을 보완했습니다. 하지만 여전히 처음 시작할 때 바로 초기화 된다는 단점을 가지고 있습니다.

---

### Lazy initalization

따라서 컴파일 로딩 시점에 "즉시" 인스턴스를 생성하려는 행위를 방지하고자, 지연 초기화(Lazy initalization) 방식이 등장했습니다. 이는 처음에 필드를 생성할때는 초기화하지 않고, `getInstance()` 메소드를 호출하게 되면 그제서야 검사를 시도합니다. 아래처럼 인스턴스가 null 이라면, 해당 인스턴스를 초기화를 시도합니다.

```java
public class MoveRepository {
    private static final MoveRepository instance;

    private MoveRepository() {
    }

    public static MoveRepository getInstance(){
      if(Objects.isNull(instance)){
        instance = new MoveRepository();
      }
      return instance;
    }
}
```

#### 장점

이로써 즉시 인스턴스가 생성되는 것이 아니라, 클라이언트가 인스턴스를 사용하려고 하는 시점에 천천히 초기화 및 인스턴스가 생성되므로 메모리를 절약할 수 있게됩니다.

#### 단점

하지만 단점은 `쓰레드 안전(Thread-Safe)` 하지 않다는 것입니다. 이게 만약에 여러개의 쓰레드가 동시에 요청하게 되면 싱글톤의 **"유일성(Unique)"** 을 보장한다는 특성을 어길 수 있게됩니다. 즉, 멀티쓰레드 환경에서 동시에 인스턴스 생성을 요청하는 상황에 발생하면 다중 인스턴스가 생길 수 있게 됩니다.

---

### Thread-safe initalization

위 지연 초기화(Lazy initalization) 는 `쓰레드 안전(Thread-safe)` 하지 못하다는 것이 단점이므로, 이를 보완할 수 있게 쓰레드 안전한 초기화 방법이 등장합니다. 자바에서 제공하는 `synchronized` 키워드를 활용하는 방식으로, 쓰레드가 이 인스턴스를 생성하는 `임계영역(Critical Section)` 에 진입할 때 순차적으로 진입할 수 있도록 하는 방식입니다. 즉, 동시에 여러 쓰레드가 인스턴스 생성 메소드에 접근하지 못하므로 하나의 인스턴스만 생성될 수 있게 됩니다.

```java
public class MoveRepository {
    private static final MoveRepository instance;

    private MoveRepository() {
    }

    public static synchronized MoveRepository getInstance(){
      if(instance == null){
        instance = new MoveRepository();
      }
      return instance;
    }
}
```

#### 장점

`쓰레드 안전(Thread-safe)` 하므로 "유일성" 이 보장됩니다.

#### 단점

하지만 `synchronized` 키워드로 인해 성능이 저하될 수 있습니다. 하나의 쓰레드만 접근이 가능하므로, 성능이 느려질 수 있는 비효율적인 방법인 것이죠.

---

### Double-Checked Locking

```java
public class MoveRepository {
    private static final MoveRepository instance;

    private MoveRepository() {
    }

    public static- MoveRepository getInstance(){
      if(instance.isNull(instance)){
      	synchronized (MoveRepository.class) {
      		if(Objects.isNull(instance)) {
            	instance = new MoveRepository();
            }
         }
      }
      return instance;
    }
}

```

그래서 등장한 것이 2번 체크를 하는 방식입니다. 첫번째로 인스턴스가 null 인지를 체크합니다. 조건문에서 인스턴스가 이미 생성되었는지 아닌지를 체크하고, 생성된게 아직 없는 경우에만 `synchornized` 키워드에 기반하여 `쓰레드 안전(Thread Safe)` 하게 인스턴스를 생성하는 방식입니다. 즉, if 문으로 앞단에서 먼저 필터링하여 `synchornized` 가 최소한으로 사용되게 하는 방식인 것으로, 이전 방식보다 성능이 더 좋아지게됩니다.

#### 장점

synchornized 로 인한 성능 저하 비용이 최소화되었으며, 쓰레드 안전하게 "유일성" 의 특징을 지닌 인스턴스 생성이 가능하다.

#### 단점

가독성이 떨어진다. 메소드 내부의 코드가 많아졌으며 인덴트도 늘어난다. (위 경우 인덴트가 3이다.)

---

### Bill Pugh Solution

```java
public class MoveRepository {

    private MoveRepository() {
    }

    private static class SingleTonHelper {
      private static final MoveRepository INSTANCE = new MoveRepository();
    }

    public static- MoveRepository getInstance(){
      return new SingleTonHelper.INSTANCE;
    }
}
```

위의 가독성 저하 원인을 보완하고자, `정적 내부 클래스(static inner class)` 클래스를 만들어서 `헬퍼 클래스(Helper Class)` 로써 동작하게 만들었습니다. 이 헬퍼 클래스 안에 인스턴스를 `static final` 로 보유하고 있습니다. `static` 의 특징으로 인해 메모리에 미리 할당했으며, 내부의 인스턴스 변수도 `final` 로 붙여서 **"불변성(immutable)"** 의 특징을 살릴 수 있게 되었습니다.

이로써 인스턴스가 `getInstance()` 를 활용하여 호출될 때, 동시에 여러 쓰레드가 호출되더라도 메모리에 미리 올라간 동일한 인스턴스를 헬퍼 클래스를 통해 전달받기 떄문에, 동시성 문제도 깔끔히 해결되고 코드의 가독성도 올라갔습니다.

따라서 여러 쓰레드로 인한 동시성 문제도 해결할 수 있게 됩니다. 또한 메소드 길이도 짧아지고 깔끔해졌습니다.

---

## 싱글톤은 정말 OOP 일까?

싱글톤에 대해서 조금이라도 학습해봤다면, "싱글톤을 지양하라" , "안티패턴인가?" 등의 논쟁거리를 자주 접해봤을겁니다.

### 상태(State) 와 공유자원을 보유한 경우

만약 싱글톤으로 구현된 클래스가 **"상태(state)"** 를 보유했다면 문제가 발생할 수 있습니다. 전역적으로 모든 쓰레드가 공유하는 인스턴스이므로, 여러 쓰레드가 상태를 바꾸게되면 `데이터의 무결성` 을 해치게 됩니다. 예를들어 "보드게임" 을 진행한다고 했을때, 이 보드게임판 클래스를 모든 유저가 공유하는 싱글톤으로 구현했다고 해봅시다. 이 경우는 모든 유저가 하나의 상태값 및 공유자원을 동시에 변경하고 조회할 수 있기 떄문에, 데이터의 일관성을 해칠 수 있습니다.

### 생성자에서 의존성이 드러나지 않는다.

`getInstance()` 로만 하나를 생성하므로 의존성이 잘 드러나지 않습니다. 따라서 상태가 없는 객체가, 또는 설계상으로 유일성을 보장해야하는 대상에 대해서만 싱글톤으로 구현해야합니다.

### 그래서 싱글톤은 안티패턴인가?

싱글톤을 구현하는 대부분의 경우는 클래스의 객체를 미리 생성하고, **정적 메소드**를 활용해서 싱글톤을 구현하게 됩니다. 따라서 싱글톤과 사용하는 클래스 사이에 강한 의존성, 높은 결합이 생기게되어서 수정, 단위테스트의 어려움이 발생합니다.

---

## 참고

- [[10분 테코톡] 🧇 크로플의 싱글턴과 정적클래스](https://www.youtube.com/watch?v=C6CczyrkYXU)
- https://tecoble.techcourse.co.kr/post/2020-11-07-singleton/
- https://kephilab.tistory.com/50
- https://bangu4.tistory.com/286
