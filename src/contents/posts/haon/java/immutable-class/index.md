---
title: 자바 불변 클래스
date: "2024-09-17"
tags:
  - JAVA
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 불변 클래스

`불변 클래스`란 해당 인스턴스의 내부 값을 수정할 수 없는 클래스입니다. 불변 인스턴스에 간직된 정보는 고정되어 객체가 파괴되는 순간까지 절대 달라지지 않습니다. 자바 라이브러리에는 `String`, `기본 타입의 박싱된 클래스들`, `BigInteger`, `BigDecimal` 등이 이에 해당합니다.

---

### 불변 클래스로 만들기 위한 규칙

클래스를 불변으로 만들려면 아래 5가지 규칙을 따르면됩니다.

#### 1. 객체의 상태를 변경하는 메소드(변경자)를 제공하지 않는다.

#### 2. 클래스를 확장할 수 없도록 한다.

하위 클래스에서 부주의하게 객체의 상태를 변하게 만드는 사태를 막아줍니다. 상속을 막는 대표적인 방법은 클래스를 final 로 선언하는 것이 있습니다.

#### 3. 모든 필드를 final 로 선언한다.

개발자가 설계의도를 가장 명확하게 표현할 수 있는 방법입니다.

#### 4. 모든 필드를 private 으로 선언한다.

필드가 참조하는 가변 객체를 클라이언트에서 직접 접근해 수정하는 일을 막아줍니다. 기술적으로는 기본 타입 필드나 불변 객체를 참조하는 필드를 `public final` 로만 선언해도 불변 객체가 되지만, 이러면 다음 릴리스에서 내부 표현을 바꾸지 않으므로 권장되는 방법은 아닙니다.

#### 5. 자신 외에는 내부의 가변 컴포넌트에 접근할 수 없도록 한다.

클래스에 가변 객체를 참조하는 필드가 하나라도 있다면 클라이언트에서 그 객체의 참조를 얻을 수 없도록 해야합니다.

### 불변 클래스 예시

```java
public final class Complex {
    private final double re;
    private final double im;

    public Complex(double re, double im) {
        this.re = re;
        this.im = im;
    }

    public double realPart() {
        return re;
    }

    public double imaginaryPart() {
        return im;
    }

    public Complex plus(Complex c) {
        return new Complex(re + c.re, im + c.im);
    }

    public Complex minus(Complex c) {
        return new Complex(re - c.re, im - c.im);
    }

    public Complex times(Complex c) {
        return new Complex(re * c.re - im * c.im, re * c.im + im * c.re);
    }

    public Complex divideBy(Complex c) {
        double tmp = c.re * c.re + c.im * c.im;
        return new Complex((re * c.re - im * c.im) / tmp,
                (re * c.im + im * c.re) / tmp);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Complex)) return false;
        Complex complex = (Complex) o;
        return Double.compare(complex.re, re) == 0 &&
                Double.compare(complex.im, im) == 0;
    }

    @Override
    public int hashCode() {
        return 31 * Double.hashCode(re) + Double.hashCode(im);
    }

    @Override
    public String toString() {
        return "(" + re + " + " + im + "i)";
    }
}
```

위 클래스는 실수와 허수를 가지는 복소수 불변클래스입니다. 실수와 허수 필드에 대한 getter 메소드는 있지만, setter 메소드는 존재하지 않습니다. 또 클래스를 final 로 정의하여 상속등의 방법으로 확장할 수 없도록 했습니다. 또 클래스의 모든 필드를 final 로 선언하여 초기화 이후 그 값이 바뀔 수 없도록 했습니다. 또한 모든 필드가 private 으로 선언되어 있어서, 클래스 외부에서는 직접 필드를 볼 수 없도록 했습니다. 마지막으로 클래스에 가변 컴포넌트가 존재하지 않습니다. 따라서 이 클래스는 불변 클래스의 5가지 규칙들을 모두 준수하고 있습니다.

---

## 불변 객체의 특징

### 불변 객체는 근본적으로 thread-safe 하다.

불변 객체는 쓰레드 안전하기 때문에, 별도의 동기화 처리가 필요없습니다. 여러 쓰레드가 동시에 사용해도 절대 훼손되지 않으며, 그 어떤 쓰레드도 다른 쓰레드에게 영향을 줄 수 없으므로 불변 객체는 안심하고 공유할 수 있습니다.

### 불변 객체끼리 내부 데이터를 공유할 수 있다.

불변 객체는 자유롭게 공유할 수 있음은 몰론, 불변 객체끼리는 내부 데이터를 공유할 수 있습니다.

### 객체를 만들때 다른 불변 객체들을 구성요소로 사용하면 이점이 많다.

값이 바뀌지 않는 구성요소들로 이루어진 객체라면, 그 구조가 복잡해도 불변식을 유지하기 훨씬 수월합니다. 예를들어, 불변객체는 Map 의 키와 집합(set) 의 원소르 쓰기에 안성맞춤입니다. Map 이나 Set 은 안에 담긴값이 바뀌면 불변식이 허물어지는데, 불변 객체를 사용하면 그런 걱정은 하지 않아도됩니다.

### 단점 : 값이 다르면 반드시 독립된 객체로 만들어야한다.

불변 클래스에도 단점은 있습니다. 값이 다르면 반드시 다른 독립된 객체로 만들어야 한다는 것입니다. 값에 아주 조금이라도 변경이 발생한다면, 기존 인스턴스 내부에서 변동이 발생하는 것이 아니라, 새로운 인스턴스를 생성해야 하는 것입니다. 대표적으로 `String` 과 `StringBuilder` 의 차이를 예로 들 수 있는데, String 과 달리 StringBuffer 는 "가변" 의 특징을 지니고 있죠.

---

## 활용방식

### 1. 클래스는 꼭 필요한 경우가 아니라면 불변이여야 한다.

getter 가 있다고해서 무조건 setter 를 만들지는 맙시다. 또 불변 클래스는 장점이 꽤 많으며, 단점이라곤 특정 상황에서의 성능 저하 뿐입니다. (ex. String 과 StringBuilder 처럼)

### 2. 불변으로 만들 수 없다면, 변경 가능한 부분을 최소화하자.

그렇다고 모든 클래스를 불변으로 만들수는 없습니다. 불변으로 만들 수 없는 클래스이더라도, 변경할 수 있는 부분을 최소한으로 줄입시다. 떄문에 꼭 변경해야할 필드를 제외한 나머지 모두를 final 으로 선언합시다. **합당한 이유가 없다면, 모든 필드를 private final 이여야 합니다.**

---

## 참고

- Effective Java (Joshua Bloch 지음)
