---
title: 대역을 활용한 외부 상황 테스트, Mock 객체의 활용을 어떻게 해야하는데? 🤷‍
date: "2024-01-11"
tags:
  - TDD
  - Mockito
previewImage: test.png
---

## 학습배경

`Mock` 객체를 사용하거나, 팀원들과 소통하면서 이 테스트를 어떻게 진행할지 고민하다보면 항상 등장하는 키워드가 바로 `Mock, 대역` 이다. 다만 아쉬운점은, 제대로 이해하지 못하고 사용해봤던지라 모호한 이해도로 테스트를 진행했다는 점이다. 이번 기회에 확실하게 대역에 대해 정리하며, 향후 테스트 작성에도 도움이 되고자 작성한다.

---

## 대역이 왜 필요한데? 🤷‍♂️

우선 대역을 "왜" 써야하는지에 대해 간단한 상황을 가정하며 되짚어본다. 가령 사용자의 계좌 잔액을 조회하는 서비스를 개발중에 있다고 해보자. 이를 위해, 하나은행에서 제공하는 오픈 API 를 활용하여 현 사용자의 계좌 잔액을 조회해야한다. 즉, 외부 요인이 현 우리의 서비스에 영향을 끼치는 상황이며, 이는 곧 외부 요인이 테스트에 관여하는 것이라 할 수 있다.

하지만 외부 요인은 테스트 작성을 어렵게 만들뿐만 아니라 테스트 결과도 예측할 수 없게 만든다. 하나은행에서 제공해주는 API 의 응답속도가 1달이라면, 우리의 테스트는 1달뒤에나 성공 여부를 판단할 수 있을 것이다.

### 그래서, 대역이란?

우리는 **대역을 활용함으로써 테스트 코드가 외부 요인에 대한 의존성을 낮출 수 있게된다. 대역이란 특정 객체의 동작을 흉내내는 객체를 말한다.** 앞선 상황에 대역을 활용한다면, 하나은행의 오픈 API 활용하는 것이 아니라 우리 서비스 내부에 임의의 가짜 하나은행 API 를 활용함으로써 신속하게 응답을 테스트 결과를 확인할 수 있게된다. 즉, 대역으로 실제 대상 대신에 가짜 객체를 이용해서 테스트를 진행하는 것이다.

---

## 대역의 종류

대역의 종류는 다음과 같이 4가지로 구분된다.

| 대역 종류   | 설명                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 스텁(Stub)  | **구현을 단순한 것으로 대체한다.** 테스트에 맞게 단순히 원하는 동작을 수행한다.                                                                  |
| 가짜(Fake)  | **제품에는 적합하지 않지만, 실제 동작하는 구현을 제공한다.** 예를들어 실제 DB 대신에 메모리를 이용해서 구현한 레포지토리가 가짜 대역에 해당한다. |
| 스파이(Spy) | **호출된 내역을 기록한다.** 기록한 내역은 테스트 결과를 검증할 때 사용한다. 스텁이기도 하다.                                                     |
| 모의(Mock)  | 기대한대로 상호작용하는지 행위를 검증한다. 기대한대로 동작하지 않으면 예외를 터뜨릴 수 있다. 모의 객체는 스텁이자 스파이도 된다.                 |

---

## 상황 가정

원활한 이해를 위해, 회원가입 기능 구현을 하나 가정할 것이다. 이 상황에 알맞게 설계된 클래스에 각각 `Stub`, `Fake`, `Spy`, `Mock` 을 적용해보자. 각 클래스(인터페이스)에 대한 설계 및 설명을 요약하자면 다음과 같다.

- SignUpService : 회원가입에 대한 핵심 로직을 수행한다.
- PasswordLengthChecker : 암호(비밀번호) 가 8자 이하인지 체크한다.
- UserRepository : 회원 정보 저장 DB
- EmailNotifier : 이메일 발송 기능을 제공한다.

SignUpService 클래스에 회원 가입의 가장 핵심인 비즈니스 로직이 담겨있으며, 이 서비스 클래스에서 나머지 3개의 인터페이스 필드를 보유하고 있는 구조를 취한다.

---

## 1. PasswordLengthChecker 에 스텁(Stub) 적용

회원가입 테스트를 위해 SignUpTest 라는 테스트 클래스를 하나 생성했다. 우리가 당장 테스트할 것은 `PasswordLengthChecker` 이다. 비밀번호가 약하다면 RunTimeException 예외가 터지는 기능을 구현한다고 가정했다. 아직 UserRepository, EmailNotifier 에 대한 멤버는 없는 것을 볼 수 있는데, 이들은 추가 테스트를 구현할 때 마다 추가될 예정이다.

```java
public class SignUpTest {
    private SignUpService signUpService;
    private StubPasswordLengthChecker stubPasswordLengthChecker = new StubPasswordLengthChecker();

    @BeforeEach
    void setUp() {
        signUpService = new SignUpService(stubPasswordLengthChecker);
    }

    @DisplayName("비밀번호가 약하다면 회원가입에 실패한다.")
    @Test
    void checkUnderLengthPassword() {
        stubPasswordLengthChecker.setIsSuccess(false);

        Assertions.assertThrows(RuntimeException.class, () -> {
            signUpService.register("msung99", "pw1", "msung99@gmail.com");
        });
    }
}
```

또 앞서 말했듯이, WeakPasswordChecker 는 비밀번호를 체킹하는 기능을 수행하고 스텁을 활용한다고 했었다. 이에 대한 구현체로 StubWeakPasswordChecker 를 생성해줬다. 이 안의 isSuccess 멤버변수는 비밀번호가 정상인지 아닌지를 체크하는 필드이며, 비밀번호 상태를 설정해주도록 setter 를 생성했다.

```java
public interface PasswordLengthChecker {
    boolean checkWeekPassword(String password);
}


public class StubPasswordLengthChecker implements PasswordLengthChecker {
    private boolean isSuccess;
    @Override
    public boolean checkWeekPassword(String password) {
        return isSuccess;
    }

    public void setIsSuccess(boolean isSuccess) {
        this.isSuccess = isSuccess;
    }
}
```

그런데 이런 의문이 들 수 있다. PasswordLengthChecker 는 비밀번호가 8자리 이하인지 아닌지를 체크한다고 했는데, 위처럼 간단히 isSuccess 를 저장하고 리턴하는 것만으로 구현해도 충분한가?

StubPasswordLengthChecker 의 checkWeekPassword() 메소드는 단순히 isSuccess 필드 값을 리턴해도 된다. 이 정도만 구현해도 SignUpService 의 register() 가 약한 암호인 경우와 그렇지 않은 경우에 대해 올바르게 동작하는지 충분히 검증 가능하다.

### 스텁(Stub) 정의 에 부합하는가?

또한 이 정도의 구현은 `스텁(Stub)` 의 정의에도 부합한다. 스텁은 테스트에 맞게 단순히 원하는 동작을 수행한다고 했었다. 현 테스트는 비밀번호가 약하면 예외가 터지는지에 대한 것이다. 따라서 스텁 대역인 StubPasswordLengthChecker 은 약한 암호 인지 여부만을 알려주기만 하면 제 역할을 충분히 수행한 것이다.

실제로 동작하는 구현은 대역에서 구현하지 않는다. 즉, StubPasswordLengthChecker 에선 단순히 비밀번호가 약하다는 것만 알려주는 역할을 수행하면 되고, 실제로 동작하는 구현인 "비밀번호가 8자 이하인지 체킹하는 구현 코드" 는 대역에서 구현하는 것이 아니라는 것이다. 이는 대역이 아닌, 향후 실제 도메인 코드에서 상세히 구현해야한다.

---

## 2. UserRepository 에 가짜(Fake) 구현 적용

다음은 DB 인 UserRepository 에 Fake 구현을 적용해보겠다. 여기서 테스트할 것은 **"중복 ID 를 가진 회원이 이미 존재할 경우 예외가 터지는지 테스트"** 해보자.

이를 위한 테스트 코드를 먼저 작성해보면 아래와 같다. 이 코드는 SignUpTest 에 추가로 작성해줬으며, 아직 필요한 클래스, 필드등을 작성하지 않았으므로 컴파일 에러가 발생할 것이다.

```java
@DisplayName("이미 같은 아이디를 가진 회원이 DB에 존재하면 가입에 실패한다.")
@Test
void duplicateExist() {
	// 이미 같은 ID 가 DB 에 존재하는 상황을 만들기
    fakeRepository.save(new User("msung99", "pw1", "msung99@gmail.com"));

    Assertions.assertThrows(RuntimeException.class, () -> {
            signUpService.register("msung99", "origin-password", "msung1234@gmail.com");
    });
}
```

이어서 기존 SignUpService 의 `register()` 메소드를 아래와 같이 일반화 시켜줬다. 코드를 보면 알겠지만, `findById()` 를 통해 아이디 값을 기반으로 유저를 데이터를 가져오도록 시도한다. 만약 가져오는데 성공한 경우라면 이미 동일한 아이디를 가진 유저가 회원가입된 상태이므로 오류를 발생시킨다.

아직은 UserRepository 에 관해 구현된 실제 코드가 없기 떄문에 컴파일 오류가 발생할 것이다.

```java
public class SignUpService {
    private PasswordLengthChecker passwordLengthChecker;
    private UserRepository userRepository; // 추가

    public SignUpService(PasswordLengthChecker passwordLengthChecker, UserRepository userRepository) {
        this.passwordLengthChecker = passwordLengthChecker;
        this.userRepository = userRepository;
    }

    public void register(String id, String password, String email) {
        if(!passwordLengthChecker.checkWeekPassword(password)) {
            throw new RuntimeException();
        }
        User user = userRepository.findById(id);
        if(user != null) {
            throw new RuntimeException();
        }
        userRepository.save(user);
    }
}
```

다음으로 UserRepository 에 대한 가짜 대역을 추가해보자. 실제 DB 와 동일하게 기능을 수행 가능한 UserRepository 의 가짜(Fake) 객체를 생성하는 것이다. 이 가짜 객체를 이용해서 이미 중복된 아이디를 가진 사용자가 존재하는 상황을 만들면 된다.

즉, UserRepository 가 구현할 실제 DB 가 JpaRepository, 기타 DB 이던간에 그와 별개로 이를 대체하는 가짜 DB 객체를 만드는 것이다. 이는 간단히 메모리상에 Map 컬렉션을 활용하여 간단히 유저 데이터를 저장하는 방식으로 구현해보겠다. 이에 대한 코드는 아래와 같다.

```java
public interface UserRepository {
    void save(User user);
    User findById(String id);
}


public class MemoryUserRepository implements UserRepository {
    private Map<String, User> users = new HashMap<>();

    @Override
    public void save(User user) {
        users.put(user.getId(), user);
    }

    @Override
    public User findById(String id) {
    	return users.get(id);
    }
}

```

또 유저 클래스도 아래와 같이 간단히 구현해주자.

```java
public class User {
    private String id;
    private String password;
    private String email;

    public User(String id, String password, String email) {
        this.id = id;
        this.password = password;
        this.email = email;
    }

    public String getId() {
        return id;
    }

    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }
}

```

이를 염두하며 새롭게 코드를 추가하여 만들어낸 SignUpTest 의 전체 코드는 아래와 같다.`MemoryUserRepository` 를 생성한 모습을 볼 수 있는데, 이는 앞서 말했듯이 실제 데이터베이스 대신에 가짜(Fake) 데이터베이스로 동작하는 것이다.

```java
public class SignUpTest {
    private SignUpService signUpService;
    private StubPasswordLengthChecker stubPasswordLengthChecker = new StubPasswordLengthChecker();
    private MemoryUserRepository fakeRepository = new MemoryUserRepository();

    @BeforeEach
    void setUp() {
        signUpService = new SignUpService(stubPasswordLengthChecker, fakeRepository);
    }

    @DisplayName("비밀번호가 약하다면 회원가입에 실패한다.")
    @Test
    void checkUnderLengthPassword() {
        stubPasswordLengthChecker.setIsSuccess(false);

        Assertions.assertThrows(RuntimeException.class, () -> {
            signUpService.register("msung99", "pw1", "msung99@gmail.com");
        });
    }

    @DisplayName("이미 같은 아이디가 DB 에 존재하면 가입에 실패한다.")
    @Test
    void duplicateExist() {
        // 이미 같은 ID 가 DB 에 존재하는 상황을 만들기
        fakeRepository.save(new User("msung99", "pw1", "msung99@gmail.com"));

        Assertions.assertThrows(RuntimeException.class, () -> {
            signUpService.register("msung99", "origin-password", "msung1234@gmail.com");
        });
    }
}
```

### 가짜(Fake) 정의에 부합하는가?

앞서 말했길, 가짜 대역이란 제품에는 적합하진 않아도 실제로 동작하는 기능을 제공한다고 했었다. 위 가짜 데이터베이스 MemoryUserRepository 는 JpaRepository 와 같은 실제 데이터베이스의 다양한 기능에는 훨씬 미치지 못한다. 하지만, 유저를 찾고, 저장하는 기능을 충분히 소화내고 있음을 알 수 있다. 따라서 가짜 대역 정의에 충분히 부합한다.

---

## 3. 이메일 발송 여부 확인을 위해 스파이(Spy) 활용

다음으로 `EmailNotifier` 에 대해서 `스파이(Spy)` 이메일 발송 기능을 적용해 볼 것이다.

이메일 발송 여부를 확인하기 위해, SignUpService 에서 EmailNotifier 의 메일 발송 기능을 실행할 때 이메일 주소로 "msung99@gmail.com" 을 사용했는지 확인하는 것이다. 이런 용도로 사용할 수 있는것이 스파이 대역이다. EmailNotifier 의 스파이 대역을 이용한 테스트 코드를 만들어보자.

회원 가입시 이메일을 올바르게 전송했는지 확인할 수 있으려면 EmailNotifier 의 **스파이 대역이** `(1)` **이메일 발송 여부와** `(2)` **발송을 요청할 때 사용한 이메일 주소를 제공할 수 있어야한다.** 이를 위한 테스트 코드는 아래와 같다.

```java
@DisplayName("가입하면 메일을 전송함")
@Test
void whenRegisterThenSendEmail() {
	signUpService.register("msung99", "msung1234", "msung99@gmail.com");

    Assertions.assertTrue(spyEmailNotifier.isCalled());
    Assertions.assertEquals("msung99@gmail.com", spyEmailNotifier.getEmail());
}
```

우선 EmailNotifier 코드가 새롭게 추가된 모습을 볼 수 있다. 이는 외부에서 생성자 주입을 통해 SpyEmailNotifier 라는 스파이 객체를 주입받을 것이다. 또한 `register()` 구현 코드가 변경되었다. 가장 눈여거 볼 부분은 맨 아래줄에 emailNotifier 를 활용한 부분이다. 이를 통해 이메일 전송 여부와, 전송한 이메일 계정을 조회할 수 있게된다.

```java
public class SignUpService {
    private PasswordLengthChecker passwordLengthChecker;
    private UserRepository userRepository; // 추가
    private EmailNotifier emailNotifier;

    public SignUpService(PasswordLengthChecker passwordLengthChecker, UserRepository userRepository, EmailNotifier emailNotifier) {
        this.passwordLengthChecker = passwordLengthChecker;
        this.userRepository = userRepository;
        this.emailNotifier = emailNotifier;
    }

    public void register(String id, String password, String email) {
        if(!passwordLengthChecker.checkWeekPassword(password)) {
            throw new RuntimeException();
        }
        User user = userRepository.findById(id);
        if(user != null) {
            throw new RuntimeException();
        }
        userRepository.save(new User(id, password, email));
        emailNotifier.sendRegisterEmail(email); // 이메일 전송 상태 저장
    }
}
```

EmailNotifier 와 스파이 구현 내용은 아래와 같이 정해줬다. SpyEmailNotifier 를 보면 이메일 호출 여부인 `called` 필드를 보유하고 있고, 호출된 이메일 정보를 저장하는 `email` 필드를 보유한 것을 볼 수 있다.

```java
public interface EmailNotifier {
    void sendRegisterEmail(String email);
}


public class SpyEmailNotifier implements EmailNotifier {
    private boolean called;
    private String email;

    public boolean isCalled() {
        return called;
    }
    public String getEmail() {
        return email;
    }
    @Override
    public void sendRegisterEmail(String email) {
        this.called = true;
        this.email = email;
    }
}
```

### 스파이(Spy) 정의에 부합하는가?

스파이의 정의를 다시 되짚어보면, **"호출된 내역을 기록한다."** 라고 내렸다. 위 SpyEmailNotifier 코드를 보면 `called`, `email` 필드를 통해 이메일 호출 여부 및 정보를 저장하고 있으므로, 스파이의 정의에 알맞게 구현된 것이라 할 수 있다.

---

## 4. 모의 객체(Mocktio) 를 활용하여 기존의 스텁과 스파이 객체를 대체하기

마지막으로 앞서 작성한 테스트 코드를 모의 객체를 활용하여 다시 작성해 볼 것이다. 모의 객체 구현을 위해 `Mockito` 를 활용한다. 또한 **Mock 객체는 스텁과 스파이를 지원한다(대체 가능하다)는 점을 알아두자.**

우선 기존 PasswordLengthChecker 에 대한 테스트 코드를 모의 객체를 활용한 코드로 변경해 볼 것이다. 그 코드는 아래와 같다.

### 비밀번호 체킹 테스트 코드

PasswordLengthChecker 에 대한 객체를 `Mock` 객체로 생성해줬다. 이어서 BDDMockito 를 활용했는데, checkWeekPassword( ) 메소드가 "pw" 라는 인자를 넘겨받은 경우 true 를 리턴하도록 설정해줬다. 즉. "pw" 파라미터를 사용해서 Mock 객체의 checkPasswordWeak 메소드를 호출하면 리턴값으로 true 를 리턴하도록 했다. 즉, 앞서 살펴봤던 PasswordLengthChecker 의 경우 `스텁(Stub)` 객체를 주입해줬다면, 이번엔 `모의(Mock)` 객체로 주입해주는 것이다.

```java
public class UserRegisterMockTest {
    private SignUpService signUpService;
    private PasswordLengthChecker mockPasswordLengthChecker = Mockito.mock(PasswordLengthChecker.class);
    private MemoryUserRepository fakeRepository = new MemoryUserRepository();
    private EmailNotifier mockEmailNotifier = Mockito.mock(EmailNotifier.class);

    @BeforeEach
    void setUp() {
        signUpService = new SignUpService(mockPasswordLengthChecker, fakeRepository, mockEmailNotifier);
    }

    @DisplayName("비밀번호가 약하다면 회원가입에 실패한다.")
    @Test
    void checkUnderLengthPassword() {
        BDDMockito.given(mockPasswordLengthChecker.checkWeekPassword("pw1"))
                .willReturn(true);

        Assertions.assertThrows(RuntimeException.class, () -> {
            signUpService.register("msung99", "pw1", "msung99@gmail.com");
        });
    }
}
```

### checkPassword 메소드 호출 여부 테스트

**대역 객체가 기대하는 대로 상호작용했는지 확인하는 것이 모의 객체의 주요 기능이다.** Mockito 를 사용하면 아래 테스트처럼 Mock 객체가 기대한대로 호출되었는지 검증할 수 있다.

`(1)` 에서 인자로 전달한 mockPasswordLengthChecker 모의 객체의 특정 메소드가 호출되었는지를 `(2)` 에서 검증하는데, `(3)` 에서 보듯이 임의의 String 타입 파라미터를 이용해서 checkPasswordWeak() 메소드 호출 여부를 확인한다. 즉, 아래 코드는 SignUpService 의 register 메소드를 호출시 PasswordLengthChecker 모의 객체의 checkWeekPassword 메소드가 호출되는지를 검증하는 테스트 코드이다.

```java
@DisplayName("회원 가입시 비밀번호 검사를 수행한다.")
@Test
void checkPassword() {
	signUpService.register("msung99", "pw", "email");

    BDDMockito.then(mockPasswordLengthChecker) // (1)
    	.should() // (2)
        .checkWeekPassword(BDDMockito.anyString()); // (3)
}
```

### EmailNotifier 테스트

Mock 객체를 사용하면 스파이도 가능하다. 모의 객체의 `sendRegisterEmail()` 메소드를 호출할 때 사용한 파라미터 값을 구하는 코드는 아래와 같다.

```java
@DisplayName("가입하면 메일을 전송함")
@Test
void whenRegisterThenSendEmail() {
	signUpService.register("msung99", "msung1234", "msung99@gmail.com");

    ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
    BDDMockito.then(mockEmailNotifier)
                   .should().sendRegisterEmail(captor.capture()); // (1)

	String realEmail = captor.getValue(); // (2)
	Assertions.assertEquals("msung99@gmail.com", realEmail);
}
```

**Mockito 의** `ArgumentCaptor` **는 Mock 객체를 호출할 때 전달한 객체를 담는 기능을 제공한다.** `BDDMockito.then().should()` 로 Mock 객체의 메소드가 호출되었는지 확인할 때 `(1)` 처럼 `ArgumentCatpor.capture()` 를 사용하면 메소드을 호출시 전달한 파라미터가 `ArgumentCatpor` 에 담긴다. 또한 `(2)` 처럼 `ArugmentCaptor.getValue()` 메소드를 사용해서 보관한 파라미터를 얻어낼 수 있다.

---

## 대역의 활용에 대해

### Why?

다시금 대역을 사용해야하는 필요성에 대해 되짚어보자. 앞서 예시 들기를, 하나은행 API 가 있을때 다양한 외부 요인이 테스트틀 방해할 수 있다고 했었다.

앞서 만들어봤던 회원 가입 예시도 다시 생각해보자. 메일이 발송되는지 확인하려면 실제 이메일 주소를 이용해서 테스트를 진행해야한다. 또한, 메일이 도착할 때 까지 메일함을 확인해야 한다. 이메일 특성상 테스트를 진행하고 몇분뒤에 메일이 도착하기도 한다. 이런 외부 요인에 구애받지 않고 원할한 테스트 진행을 가능케하는것이 바로 대역이다.

**대역은 페어 프로그래밍에도 도움된다.** 대역이 없었다면, 개발자 1이 기능 A를 개발 완료하기 전까지 개발자 2는 기능 A 를 활용한 본인의 도메인 개발이 힘들다. A 가 개발이 완료되기 전까지 대기해야할 것이다. 하지만 대역을 활용한다면 A 에 대한 실제 구현이 없이도 다양한 상황에 대해 테스트할 수 있다.

또한 대역을 활용하면 실제 구현 없이도 실행 결과를 확인할 수 있다. DB 가 없어도 데이터가 올바르게 저장되는지 확인 가능하고, 메일 서버가 없어도 이메일 발송 요청을 하는지 확인할 수 있다.

**즉, 대역은 의존하는 대상을 구현하지 않아도 테스트 대상을 완성할 수 있게 만들어준다. 이는 대기 시간을 줄여주며 개발 속도를 높이는데 도움이 된다.**

### Mock 객체의 과한 사용을 지양하자

앞서 말했듯이 **Mock 객체는 스텁과 스파이를 지원한다(대체 가능하다).** 때문에 대역으로 Mock 객체를 많이 사용한다. 하지만 Mock 객체를 과하게 사용하면 되려 테스트 코드가 복잡해지는 경우도 발생하니 주의해서 사용해야한다.

Mock 객체를 이용하면 대역 클래스를 만들지 않아도 되니깐 처음에는 편할 수 있다. 하지만 결과값을 확인하는 수단으로 Mock 을 사용하기 시작하면 결과 검증 코드가 길어지고 복잡해진다.

이런 이유로 Mock 객체의 메소드 호출 여부를 결과 검증 수단으로 사용하는 것은 주의해야한다. **특히 DAO 나 Repository 와 같이 저장소에 대한 대역은 Mock 객체를 사용하는 것 보다 메모리를 이용한 가짜(Fake) 구현을 사용하는 것이 테스트 코드 관리애 유리할 것이다.**

---

## 더 학습해볼 키워드

- E2E Test
