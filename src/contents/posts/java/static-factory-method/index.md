---
title: 생성자 대신 정적 팩터리 메서드 사용을 고려하라
date: "2023-08-29"
tags:
  - JAVA
previewImage: strategy-pattern.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 전통적인 public 생성자

전통적인 수단으로 `public 생성자` 를 활용하여 인스턴스를 생성하는 방법을 한번씩을 사용해봤을 겁니다. 예를들어 아래와 같이 생성했겠죠.

```java
Cat cat1 = Cat("고양이");
```

하지만 public 생성자 대신 (혹은 생성자와 함꼐) 정적 팩토리 메소드를 제공하여 인스턴스를 쉽고 가독성있게 생성할 수 있는 방법이 존재합니다. 정적 팩토리 메소드를 활용했을 때 어떤 장점이 있는것인지에 대해 알아봅시다.

---

## 1. 이름을 가진 생성자 (용도를 명확히 파악할 수 있다)

### 전통 public 생성자로 선언시

전통적인 public 생성자를 통해 생성자를 생성한다면, 해당 생성자는 이름을 가질 수 없습니다. 예를들어 아래와 같이 Cat 이라는 클래스를 생성했다고 해봅시다.

```java
class Cat {
	private String sound;
 	private int speed;

    Cat(String sound){
       if(sound.equals("냐용")){
          this.sound = sound;
          this.speed = 10;
       } else if(sound.equals("냐오오오용")){
          this.sound = sound;
          this.speed = 10000;
       }
}

    Cat(int speed){
        if(spped == 10){
           this.sound = "냐용";
           this.speed = speed;
        } else if(spped == 10000){
           this.sound = "냐오오오용";
           this.speed = speed;
        }
}
```

위는 파라미터로 전달받는 타입(String, int) 에 따라 생성하는 인스턴스의 구현체가 달라지며, 이름도 존재하지 않습니다. 사용자, 즉 클라이언트는 클래스의 인스턴스 사용법을 정확히 파악하기 위해선 모든 생성자의 구현부를 일일이 살펴볼 수 밖에 없을겁니다.

객체를 생성할 경우는 아래와 같이 여러 타입의 파라미터로 분기처리 될 겁니다.

```java
Cat cat1 = new Cat("나용");
Cat cat2 = new Cat("냐오오오용");
Cat cat3 = new Cat(10);
Cat cat4 = new Cat(10000);
```

하지만 이렇게 작성하면 과연 가독성이 좋을까요? 사용자는 인스턴스를 생성하기 위해 어떤 파라미터를 넘겨야 인스턴스를 생성할 수 있는지를 모르며, 결국 가독성 저하의 원인이 됩니다. 여기서 생성자가 더 추가된다면 사용자는 더욱이 인스턴스 생성에 혼란을 느낄 수밖에 없습니다.

### 사용용도가 명확히 파악되는 생성자

반면 정적 팩터리 메소드는 이름만 잘 지으면 반환될 객체의 특성을 쉽게 묘사할 수 있습니다. 아래를 보면, static 메소드를 사용했을때의 인스턴스 생성 방식으로써 더욱 가독성있는 객체 생성방식이 되었습니다.

```java
Cat cat1 = Cat.createByMaxSound("냐용");
Cat cat2 = Cat.createByMinSpeed(10);
```

결국 정적 펙토리 메소드를 통한 인스턴스 생성방식은, 한 클래스에 시그니처가 같은 생성자가 여러개 필요할 것 같으면 생성자를 정적 펙토리 메소드로 바꾸고 각각의 차이를 잘 들어내는 이름을 지어주는 것이 좋습니다.

---

## 2. 싱글톤(SingleTon) 또는 통제 클래스로 동작한다.

다음으로, **호출될 때마다 인스턴스를 새로 생성하지 않아도 되며, 불필요한 중복 객체생성을 방지할 수 있습니다.** 덕분에 인스턴스를 미리 생성해두거나, 생성한 인스턴스를 캐싱하여 재활용하는 방식으로 불필요한 객체 생성을 피할 수 있습니다.

즉, 반복되는 요청에 같은 객체를 반환하는 식으로 동작하는 클래스를 `통제(instance-controlled)` 클래스라고 하며, 이는 곧 해당 클래스가 `싱글톤(SingleTon)` 과 `불가(noninstaniable)` 를 보장할 수 있게 되는것입니다. 또한 불변 값 클래스에서 동일한 값을 가지고있는 인스턴스를 단 하나 뿐임을 보장할 수 있게 됩니다. (a == b 일떄만 a.equals(b))

```java
public static Integer valueOf(int i){
   if(i >= IntegerCache.low && i <= IntegerCache.high)
      return IntegerCache.cache[i + (-IntegerCache.low)];
   return new Integer(i);
}
```

만약 자주 생성되는 인스턴스는 클래스 내부에 미리 생성해 놓은 다음 반환한다면 코드 성능을 개선할 수 있을겁니다. 예를들어 위처럼 `Integer` 클래스의 `valueOf` 구현 내용을 보면, 전달된 정수 `i` 가 캐싱된 숫자 범위내에 있으면 , 객체를 새롭게 생성하지 않고 "미리 생성된" 객체를 반환합니다. 그렇지 않을 경우에만 `new` 키워드를 사용하여 객체를 생성하는 것을 확인할 수 있습니다. 이 또한 인스턴스 통제(Instance-Controlled) 클래스라고 부릅니다.

---

## 3. 반환 타입으로 하위 타입 객체를 반환가능

클래스의 단순 생성자는 해당 클래스의 인스턴스만 만들 수 있습니다. 반면 정적 펙토리 메소드를 사용하면, 하위 클래스의 인스턴스까지 반환할 수 있게됩니다. 이를 활용하면 구현 클래스를 공개하지 않고도 그 객체를 반환할 수 있습니다.

새로운 인터페이스와 수많은 구현 클래스가 있을 때, 구현 클래스의 생성자로 인스턴스를 만드는게 아니라 인터페이스의 정적 펙토리 메소드로 인스턴스를 만들어서 개발자가 수많은 구현 클래스들을 이해하지 않고도 인터페이스를 사용할 수 있도록 할 수 있습니다.

```java
	interface Exercise {
        static Exercise createSoccer(){
            return new Soccer();
        }

        static Exercise createBaseball(){
            return new Baseball();
        }

        void playGame();
    }

    class Soccer implements Exercise {
        @Override
        public void playGame(){
            System.out.println("축구를 시작합니다.");
        }
    }

    class Baseball implements Exercise {
        @Override
        public void playGame(){
            System.out.println("야구를 시작합니다.");
        }
    }

    // 테스트를 진행
    public void printTest(){
        Exercise exercise = Exercise.createBaseball();
        exercise.playGame(); // "야구를 시작합니다;"
    }
```

예를들어 위처럼 사용자는 Exercise 인터페이스의 하위 타입인 클래스 Soccer, Baseball, Boxing 의 구현체를 직접 알 필요가 없습니다. 오로지 Exercise 라는 상위 타입인 인터페이스를 알고있기만 하면, 상황에 알맞게 정적 펙토리 메소드를 호출하여 하위 타입을 주입받으면 끝입니다.

자바 8부터는 **인터페이스가 정적 메소드를 가질 수 있게 되었으므로, 인터페이스 내부에 정적 펙토리 메소드를 갖는 형태로 코드를 작성하면 됩니다.**

---

## 4. 입력 파라미터에 따른 다른 클래스 객체 반환가능

앞서 말한 장점과 비슷한 내용입니다. 정적 펙토리 메소드를 활용하면, 같은 메소드드라도 상황 및 입력 파라미터 개수에 따라 다른 클래스 인스턴스를 반환할 수 있게됩니다. 예를들어 적은 메모미를 사용해야하는 경우와, 그 반대의 경우에 따라 다른 클래스를 반환함으로써 자원을 효율적으로 사용할 수 있습니다.

---

## 5. 정적 팩토리를 작성하는 시점에는 반환할 객체의 클래스가 존재하지 않아도 된다.

클래스가 존재해야 생성자가 존재할 수 있습니다. 하지만 정적 펙토리 메소드는 메소드와 반환할 타입만 정해두고, 실제 반환될 클래스는 나중에 구현하는게 가능합니다. 프로젝트의 규모 및 여러 개발팀이 협력하는 상황에서, 원활한 협업을 위해 인터페이스까지 먼저 합의하여 만들고, 실제 구현체는 추후 만드는 식으로 업무가 진행됩니다. 이때 정적 펙토리 메소드를 사용할 수 있습니다.

---

## 정적 펙토리 메소드의 단점

무조건 장점만 있는것은 아닙니다. 분명 단점도 존재하긴 합니다.

### 1. 문서화가 힘들다.

`자바독(JavaDoc)` 등을 활용하여 Java 클래스를 문서화할때, 자바독에서 클래스의 생성자는 잘 표시해두지만, 정적 펙토리메 메소드는 일반 메소드이기 때문에 개발자가 직접 문서를 찾아야합니다.

### 2. private 생성자인 경우 상속이 불가능하다.

상속을 하려면 public 이나 protected 생성자가 필요하니, 정적 펙토리 메소드만 제공하면 하위 클래스를 만들 수 없습니다. 정적 펙토리 메소드만을 사용하게 하려면 기존 생성자는 private 으로 해야하고, 상속을 할 수 없게됩니다. 하지만 이 단점은 상속보다 컴포지션 사용을 유도하고 불변 타입으로 만들려면 이 제약을 지켜야 한다는 점에서 장점으로 받아들일 수도 있습니다.

---

## 정적 펙토리 메소드 네이밍

앞서 언급한 `단점1. 문서화가 힘들다` 를 보완하기 위해, 널리 알려진 정적 펙토리 메소드 규악을 준수하면서 메소드를 명명하는 것이 좋습니다.

### 1. from

매개변수를 하나 받아서 해당 타입의 인스턴스를 반환하는 형변환 메소드

```java
Date d = Date.from(instant);
```

### 2. of

여러 매개변수를 받아 적합한 타입의 인스턴스로 반환하는 집계 메소드

```java
Set<Rank> faceCards = EnumSet.of(JACK, QUEEN, KING);
```

### 3. valueOf

`from` 과 `of` 의 더 자세한 버전

```java
BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);
```

### 4. instance 또는 getInstance

(매개변수를 받는다면) 매개변수로 명시한 인스턴스를 반환하지만, 같은 인스턴스임을 보장하지는 않습니다.

```java
StackWalker luke = StackWalker.getInstance(options);
```

### 5. create 또는 newInstance

`instance` 또는 `getInstance` 와 같지만, 매번 새로운 인스턴스를 생성해 반환함을 보장합니다.

```java
Object newArray = Array.newInstance(classObject, arrayLen);
```

### 6. getType

`getInstance` 와 같지만, 생성할 클래스가 아닌 다른 클래스에 펙토리 메소드를 정의할 때 씁니다. "Type" 은 펙터리 메소드가 반환할 객체의 타입입니다.

```java
FileStore fs = FIles.getFileStore(path);
```

### 7. newType

`newInstance` 와 같으나, 생성할 클래스가 아닌 다른 클래스에 펙터리 메소드를 정의할 때 씁니다. "Type" 은 펙터리 메소드가 반환할 객체의 타입입니다.

```java
BufferedReader br = Files.newBufferedReader(path);
```

### 8. path

`getType` 과 `newType`의 간결한 버전

```java
List<Integer> litany = Collections.list(legacyLitancy);
```

---

## 참고

- https://nankisu.tistory.com/87
- https://hudi.blog/effective-java-static-factory-method/
