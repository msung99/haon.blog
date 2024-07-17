---
title: 싱글톤(SingleTon) 패턴 구현방법 6가지, Bill Pugh Solution
date: "2024-07-18"
tags:
  - Java
  - 디자인패턴
previewImage: strategy-pattern.png
---

## 학습동기

이번 카카오테크 교육과정 실습 미션은 `상품 할인 관리 시스템 구현하기` 이다. 디자인패턴을 학습하고 코드를 구현하는 것이 요구사항인데, 이 과정에서 싱글톤을 사용하게 되었다. 지난 포스트에서 전략 패턴에 대해서도 다루었는데, 이어서 싱글톤에 대해서도 생각을 정교화하고자 글을 작성한다.

## 싱글톤(SingleTon)

싱글톤(SingleTon) 이란 인스턴스를 오직 하나만 생성할 수 있는 클래스를 뜻한다. `(1) 유일성` - 프로그램 내에서 하나의 객체만 존재하며, `(2)` 프로그램 내의 여러 부분에서 해당 객체를 공유해서 사용해야 할 때 사용하는 디자인패턴이다.

다만 유의할 점은, 싱글톤으로 구현한 클래스는 테스트하기 어렵다는 특징이 있다. 인터페이스를 하나 정의 후, 해당 인터페이스를 구현해서 만든 오브젝트가 싱글톤이 아니라면 Mock 객체 구현 방식으로도 대체할 수 없기 떄문이다. 

## 싱글톤 오브젝트 생성 방법 

싱글톤 객체를 생성하는 방식에는 아래와 같은 2가지 방식이 존재한다.

### public static fial 키워드와 private 생성자 

private 생성자를 두고, public static final 키워드로 객체를 생성하는 방식이다. private 생성자는 public static final 필드인 인스턴스를 초기화할 떄 딱 1번만 호출된다는 특징이 있다. 생성자가 public 이나 protected 가 아니므로, 오브젝트가 초기화화 될 떄 만들어진 인스턴스가 전체 시스템에서 단 1개뿐임이 보장된다.

~~~java
public class Book {
    public static final User instance = new Book(); // 시스템 내에 유일성을 갖는 단 1개의 객체

    private Book() {
        // ...
    }

    public void getBookInfo() {
        // ...
    }
}
~~~

### 정적 팩토리 메소드로 public static 멤버로 제공하는 방식

정적 팩토리 메소드를 통해 public static 멤버를 제공하는 방식으로도 싱글톤을 보장할 수 있다. 아래의 경우 `getInstance()` 로 항상 같은 동일한 객체를 참조한 결과를 반환하므로 싱긑톤이 보장된다. 여기서도 마찬가지로 private 생성자가 호출되기 떄문에, 외부에서 신규 객체가 생성되는 상황을 방지할 수 있다.

~~~java
public class Book {
    private static final Book instance = new Book();

    private Book() {
        // ...
    }

    public static Book getInstance() {
        return instance;
    }

    public void getBookInfo() {
        // ...
    }
}
~~~


### private 생성자

여기서 둘의 공통점은 바로 `private 생성자` 이다. 생성자를 private 으로 생성함으로써 외부에서 새로운 객체의 생성을 방지할 수 있다.

~~~java
Book book1 = Book.geInstance();
Book book2 = Book.getInstance();

System.out.println(book1);// book1, book2 는 같은 인스턴스이므로 같은 주소값 반환
System.out.println(book2);
~~~

## 장점
- 같은 자원을 사용하려는 여러 클라이언트가 의존 객체들을 안심하고 공유할 수 있다.
- 정적 팩토리, 빌더 모두에 동일하게 적용 가능하다.
- 클래스의 테스트, 유연성, 재사용성등을 개선해준다.

## 싱글톤의 구현 방식 6가지

위와 같은 기본적인 규칙을 기반으로, 지금까지 싱글톤의 구현 방식이 역사적으로 진화해왔다. 6가지 형태로 진화해왔는데, 각 구현 방식에 대해 간단히 살펴보도록 한다.

### Early Initalization

가장 먼저 등장한 싱글톤 구현 방식으로, `즉시 초기화(Eager Initalization)` 방식이다. 이 방식은 필드에 자기자신 타입의 인스턴스를 필드로 하나 보유하고, 바로(즉시) 초기화하는 방식이다.

~~~
public class MoveRepository {
    private static final MoveRepository instance = new MoveRepository();

    private MoveRepository() {
    }

    public static MoveRepository getInstance(){
        return instance;
    }
}
~~~

#### 장점 

인스턴스 생성이 굉장히 빠르다.

#### 단점

생성한 인스턴스를 사용하는 일이 없더라도, 프로그램을 실행하면 static 을 로딩하면서 바로 메모리 공간을 차지해버린다. 즉, 클라이언트에서 이렇게 생성된 인스턴스를 사용하지 않더라도 인스턴스가 항상 무조건 생성되버리며, 무엇보다 예외 처리를 할 수 있는 방법이 없다.

### Static Block Initalization

~~~java
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
~~~

위 단점중에 "에외처리" 문제를 보완하고자, `static` 블록을 추가하고, 그 안에서 인스턴스 생성을 시도하면서 동시에 예외 처리를 넣는 방식이 등장했다. 이로써 인스턴스 생성시 즉시 예외처리가 가능해진다는 점을 보완했다. 하지만 여전히 처음처음 시작할 떄 바로 초기화 된다는 단점을 가지고 있다.

### Lazy initalization

따라서 컴파일 로딩 시점에 "즉시" 인스턴스를 생성하려는 행위를 방지하고자, 지연 초기화 방식이 등장했다. 이는 처음에 필드를 생성할 떄는 초기화하지 않고, `getInstance()` 메소드를 호출하게 되면 그제서야 검사를 시도한다. 아래처럼 인스턴스가 null 이라면, 해당 인스턴스를 초기화를 시도한다.

~~~java
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
~~~

#### 장점

이로써 즉시 인스턴스가 생성되는 것이 아니라, 클라잉너트가 인스턴스를 사용하려고 하는 시점에 천천히 초기화 및 인스턴스가 생성되므로, 메모리를 절약할 수 있다.

#### 단점

하지만 `thread safe` 하지 않다. 만약 여러개의 쓰레드가 동시에 요청하게 되면 싱글톤의 `유일성(unique)` 를 보장한다는 특성을 어길 수 있게된다. 즉, 멀티쓰레드 환경에서 동시에 인스턴스 생성을 요청하는 상황에 발생하면 다중 인스턴스가 생길 수 있게된다.

### Thread-safe initalization

앞선 지연 초기화 방법은 thread safe 하지 않으므로, 이를 보완할 수 있게 thread safe 한 초기화 방법이 등장했다. 자바에서 제공하는 `synchornized` 키워드를 활용하는 방식으로, 쓰레드가 이 인스턴스를 생성하는 `임계영역(Critical Section)` 에 진입할 때 순차적으로 진입할 수 있도록 하는 방식이다. **즉, 동시에 여러 쓰레드가 인스턴스 생성 메소드에 접근하지 못하도록 하나의 인스턴스만 생성됨을 보장한다.**

~~~java
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
~~~

#### 장점

Thread Safe 하므로 유일성이 보장된다.

#### 단점

하지만 `synchornized` 키워드를 사용함으로 인해 성능이 저하될 수 있다. 하나릐 쓰레드만 초기화 임계영역에 접근 가능하기 떄문이다.

### Double-Checked Locking

그래서 등장한 것이 2번 체크를 하는 방식입니다. 첫번째로 인스턴스가 null 인지를 체크합니다. 조건문에서 인스턴스가 이미 생성되었는지 아닌지를 체크하고, 생성된게 아직 없는 경우에만 `synchornized` 키워드에 기반하여 `쓰레드 안전(Thread Safe)` 하게 인스턴스를 생성하는 방식입니다. 즉, if 문으로 앞단에서 먼저 필터링하여 `synchornized` 가 최소한으로 사용되게 하는 방식인 것으로, 이전 방식보다 성능이 더 좋아지게됩니다.

~~~java
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
~~~

#### 장점 

synchornized 로 인한 성능 저하 비용이 최소화되었으며, 쓰레드 안전하게 "유일성" 의 특징을 지닌 인스턴스 생성이 가능하다.

#### 단점

가독성이 떨어진다. 메소드 내부의 코드가 많아졌으며 인덴트도 늘어난다. (위 경우 인덴트가 3이다.)

### Bill Pugh Solution

위의 가독성 저하 문제를 보완하고자, `정적 내부 클래스(static inner class)` 클래스를 만들어서 `핼퍼 클래스(Helper Class)` 로써 동작하ㅔ 만들었다. 이 헬퍼 클래스 안에 인스턴스를 `static final` 로 보유하고 있다. `static` 의 특징으로 인해 메모리에 미리 할당했으며, 내부의 인스턴스 변수도 `final` 을 붙여서 `불변성` 의 특징을 보장한다.

~~~java
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
~~~

이로써 인스턴스가 `getInstance` 를 활용하여 호출될 때, 동시에 여러 쓰레드가 호출되더라도 메모리에 미리 올라간 동일한 인스턴스를 헬퍼 클래스를 통해 전달받기 떄문에, 동시성 문제도 깔끔히 해결되고 코드의 가독성도 개선되었다.

따라서 여러 쓰레드로 인한 동시성 문제도 해결할 수 있게 됩니다. 또한 메소드 길이도 짧아지고 깔끔해졌다.

---

## 참고

- https://www.youtube.com/watch?v=C6CczyrkYXU
- https://tecoble.techcourse.co.kr/post/2020-11-07-singleton/
- https://kephilab.tistory.com/50
- https://bangu4.tistory.com/286



