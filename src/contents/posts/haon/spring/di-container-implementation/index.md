---
title: 어노테이션 기반 DI 컨테이너 프레임워크 구현하기
date: "2024-11-24"
tags:
  - 스프링
  - DI
previewImage: spring.png
---

> 본 포스팅에서 실제 구현한 실습 구현 코드는 [DI 컨테이너 구현하기 PR](https://github.com/Durable-developers/di-framework/pull/1) 에서 확인할 수 있다.

## 왜 DI 가 필요한가?

DI 의 필요성에 대해 정리하기 전에 먼저 `의존관계(Dependency)` 에 대해 정리해볼 필요가 있다. 의존관계란 한 객체에서 모든 일을 처리하기 힘들기 때문에, 무게가 무거워지기 때문에 내가 해야할 일을 다른 객체에게 위임하면서 발생한다.

가령 레이어드 아키텍처에서 UserController 가 모든 회원가입 로직을 담당할 수 있음에도 UserService, UserRepository 객체를 필요로 하고, 역할과 책임을 떠넘기게 된다. 이때 의존관계가 발생하는 것이다. **내가 가지고 있는 역할과 책임을 다른 객체에게 위임하는 순간 의존성이 발생하는 것이다.** 지금껏 스프링부트 프레임워크를 사용할 때 DI, 싱글톤에 대한 내용은 수 없이 들어왔다. 만약 DI 컨테이너 개념이 도입되지 않았다면, 의존관계에 있는 객체를 사용하기 위해 객체를 매번 new 키워드로 직접 생성하고 사용하는 방식으로 구현했을 것이다.

이번 포스트에선 실습 수행 구현 코드를 어떻게 구현했는지 단순히 나열하지 않고, 왜 DI 컨테이너가 필요하고 어떤 방식으로 발전되었는지를 상세히 설명하는 것을 목표로 한다.

### DI 란?

DI 하면 가장 먼저 떠오르는 디자인 패턴이 `싱글톤(SingleTon)` 임을 스프링부트 프레임워크를 한 번이라도 공부해봤다면 알 것이다. 싱글톤으로 구현되지 않은 프레임워크라면 가령 Service 레이어 오브젝트에서 Dao, Repository 객체를 사용하기 위해 객체를 매번 직접 생성해야한다. 하지만 이 방식은 유연한 개발, 확장성을 제한하기 때문에, **인스턴스를 생성하는 책임과 사용하는 책임을 분리하자는 것이 DI 의 핵심이자 등장 이유이기도 하다.** 즉, Service 는 레포지토리에 대한 인스턴스를 생성하는 책임을 없애고, 단순히 사용만 함으로써 유연성을 높이는 것이 DI 접근 방식이다.

정리하자면, DI 란 객체간의 의존관계에 대한 결정권을, 의존관계를 가지는 객체가 가지는 것이 아니라 외부의 제 3자가 담당하도록 역할을 떠넘김으로써 더 유연한 구조로 개발하는 기법이다.

---

## step1. static 키워드 기반 싱글톤 컨테이너

### static 기반의 안티패턴 컨테이너

한편 [자바의 싱글톤(SingleTon) 패턴 구현 방법 6가지, Bill Pugh Solution](https://haon.blog/java/singleton/) 에서도 설명했듯이 싱글톤은 안티패턴이라고도 불리는 패턴이다. 객체지향적이지 못하다는 의견이 분분하다. 이때 말하는 싱글톤은 `static` 키워드를 기반으로 구현한 경우에 해당한다.

static 키워드를 사용하면 변화에 유연하게 대응하기 힘들다. static 메소드를 사용하는 부분에서 요구사항이 변경된다면 모든 코드도 변경되어야 한다. 즉 static 키워드에 기반하여 컨테이너를 구현할 경우 DIP, OCP 등의 원칙을 위반하게 된다.

static 기반의 싱글톤 컨테이너 구현은 아래와 같은 단점이 있다.

> - (1) 테스트의 어려움 : 싱글톤 패턴으로 구현된 클래스와 의존관계를 가지는 경우 해당 클래스와 강한 의존관계를 가지기 때문에 테스트하기 어렵다.
> - (2) 상속 불가능 : getInstance( ) 와 같은 메소드로 정적 팩토리 메소드를 만들고 생성자를 Private 으로 감추기 떄문에, 싱글톤으로 구현된 클래스를 상속할 수 없다.
> - (3) OCP, DIP 위반 : 유연한 확장이 불가능하디. 클래스간의 강한 의존관계가 발생하여, 한 객체의 변화가 발생할 경우 다른 의존 객체에서도 변화가 발생한다.

예를들어 아래와 같은 UserController, UserService, UserDao 가 있다고 해보자. 둘 다 static 기반의 싱글톤으로 구현된 클래스다.

```java
public class UserController extends AbstractConntoller {
  private UserService userService = UserService.getInstance(UserDao.getInstance());

  // ...
}
```

```java
public class UserService {
  private static UserService userService;

  private UserDao userDao = UserDao.getInstance();

  private UserService() {
  }

  private static UserService(UserDao userDao) {
    this.userDao = userDao;
  }

  public static UserService getInstance(UserDao userDao) {
    if(userService == null) {
      userService = new UserService(userDao);
    }
    return userService;
  }

  // ...
}
```

```java
public class UserDao {
    private static UserDao userDao;
    private JdbcTemplate jdbcTemplate = JdbcTemplate.getInstance();

    private UserDao() {
    }

    public static UserDao getInstance() {
        if (userDao == null) {
            userDao = new UserDao();
        }
        return userDao;
    }

    public void insert(User user) {
        String sql = "INSERT INTO USERS VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, user.getUserId(), user.getPassword(), user.getName(), user.getEmail());
    }

    // ...
```

위와 같은 코드는 테스트하기 쉬울까? 위 코드의 모든 로직들이 원활히 수행되는지 알기위해 테스트 코드를 작성하는 것을 가정해보자. 이때 나는 데이터베이스에 의존하지 않고 테스트를 진행하고 싶다. 즉, 데이터베이스와의 의존관계 없이 독립적으로 테스트를 진행하고 싶다.

하자만 막상 UserDao 코드를 보면 데이터베이스와의 의존관계가 발생하고 있다. 따라서 UserDao 가 데이터베이스와 의존관계를 가지지 않도록 코드를 변경해야지 데이터베이스에 의존하지 않는 테스트가 가능하다. 이를위해 코드를 어떻게 수정해야할까?

### 고민1. UserDao 를 상속한다.

UserDao 를 상속한 클래스를 하나 만들어서 메소드를 오버라이드 하면 될 것이다. 하지만 UserDao 에 대한 생성자를 싱글톤 패턴을 적용하면서 private 으로 구현했기 때문에 상속이 불가능하다.

### 고민2. 생성자를 protected 로 변경한다.

그렇다면 private 메소드를 protected 로 변경하는 것을 생각해볼 수 있다. 하지만 이는 싱글톤 패턴 구현 방식에 어긋난다.

---

## step2. 인터페이스를 통한 유연한 확장으로 개선

위 고민1, 고민2 으로는 싱글톤 구현, 유연한 확장에 제한이 있다. 이를 해결하기 위한 해결안은 인터페이스에 있다.

### 고민3. Mocking(모킹) 을 통한 의존성 해소

객체 간의 의존관계에 대한 강한 의존성을 줄이기 위해 인터페이스를 적용해보자. 기존 UserDao 에 대한 추상화 타입인 인터페이스를 하나 적용하면 유연한 확장이 가능해질 것으로 기대된다.

이에 대한 개선된 코드는 아래와 같다.

```java
public interface UserDao {
  // ...
}

public class MockUserDao implements UserDao {
  private Map<Long, User> users = Maps.newHashMap(); // In-Memory DataBase

  @Override
  public void insert(User user) {
    users.put(user.getId(), user);
  }

  // ...
}
```

기존 UserDao 클래스 이름을 JdbcUserDao 로 변경하고, 이에 대한 추상화 인터페이스를 UserDao 로 구현했다. 또한 테스트 작성을 위한 Mock 객체를 위처럼 MockUserDao 로 구현할 수 있다. MockUserDao 는 Map 을 활용한 인메모리 데이터베이스를 활용하기 때문에, 실제 데이터베이스와 의존성이 발생하지 않았다.

이로써 데이터베이스와 의존관계를 가지지 않음을 확신을 가지며 아래 테스트 코드를 수행한다.

```java
public class UserDaoTest {
  private UserService userService;
  private MockUserDao userDao;

  @Before
  public void setUp() {
    userDao = new UserDao();
    userService = UserService.getInstance(userDao);
  }

  @Test
  public void deleteUser() throws Exception {
    User user = new User();
    userDao.insert(user);
    userService.deleteUser();
  }
}
```

예상처럼 테스트 코드는 원활히 수행될 것이다. 그렇다면 위처럼 인터페이스 기반 테스트 코드는 앞서 언급한 3가지 단점을 보완했을까? 우선 `(2) 상속의 어려움` 을 먼저 생각해본다면, 이는 다행히 해결되었다고 볼 수 있을것이다. Dao 테스트 작성을 위해 Dao 를 상속한 메소드가 필요했는데, 이를 대체할 모킹(Mocking) 클래스를 생성했기에 가능하다.

하지만 `(1) 테스트의 어려움` 이 온전히 해결되었다고 볼 수 있을까? 아직 모호하다. 테스트를 위해 Mock 객체를 매번 구현해야 하는 것은 꽤 많은 비용이 들고 번거로운 작업이다. **즉, 순수히 싱글톤 패턴으로 구현하면 테스트에 어려움이 발생한다.**

---

## step3. 싱글톤 패턴을 제거한 DI

위처럼 싱글톤 패턴으로 구현할 경우 많은 문제점을 결코 해결할 수 없음을 살펴봤다. 싱글톤 패턴을 활용하는 경우 싱글톤 패턴으로 구현된 클래스와 의존관계를 가지는 경우 해당 클래스와 강한 의존관계를 가지기 떄문에 테스트하기 어렵다.

또한 어떤 형태로던 억지로 테스트가 가능하겠지만, 위처럼 매번 Mock 객체를 구현해야 하는 것은 많은 비용이 발생한다. 몰론 Junit 차원에서 `Mockito` 를 제공하긴 하지만, 매번 모킹을 활용한다는 그 자체의 행위는 좋아보이지 않는다. 모킹은 구현체의 내부 구현에 대해 잘 알아얄하며, 내부 구현 변경에 민감하다는 점에서 꼭 필요한 경우를 제외하곤 사용을 지양하는 것이 좋을 것이다.

### LegacyHandlerMapping 에 DI 적용

> `HandlerMapping` 에 대한 구현 코드는 [어노테이션 기반 Spring MVC 프레임워크 구현하기](https://haon.blog/spring/annotation-mvc-framework/) 를 참고하자 🙂

그렇다면 싱글톤 패턴을 적용하지 않는다면 어떻게 인스턴스 하나만을 생성해 인스턴스를 재사용할 수 있을까? 이는 기존 `HandlerMapping` 을 리팩토링 함으로써 구현할 수 있다. 기존에 HandlerMapping 인터페이스의 구현 클래스인 `LegacyHandlerMapping`, `AnnotationHandlerMapping` 내부에선 컨트롤러에 대해 싱글톤 패턴을 적용하지 않고 싱글톤과 동일한 효과를 낼 수 있었다. (각 컨트롤러에 대한 인스턴스를 1개만 존재하도록 유일성을 보장할 수 있었으니.)

이것이 가능한 이유는 서블릿 컨테이너가 DispatcherServlet 을 초기화하는 시점에 컨트롤러 인스턴스를 생성한 후 재사용 가능하도록 구현했기 떄문이다. 이와 동일한 방식으로 인스턴스를 관리한다면 굳이 싱글톤 패턴을 적용하지 않으면서 인스턴스 하나를 재사용할 수 있게된다.

### 싱글톤 제거 및 리팩토링 코드

UserService 에 대한 싱글톤 패턴을 제거해보자. 싱글톤 패턴을 위한 코드를 모두 제거하고 생성자를 public 으로 전환한다.

```java
public class UserService {
  private UserDao userDao;

  public UserService(USerDao userDao) {
    this.userDao = userDao;
  }

  // ...
}
```

다음은 UserController 에 대해 싱글톤을 제거했다. 아래처럼 getInstance 를 제거하고, 생성자를 public 으로 전환했다.

```java
public class UserController extends AbstractController {
  private UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  // ...
}
```

마지막으로 각 컨트롤러를 생성할 때 UserService, UserDao 를 DI 로, 즉 HandlerMpaping 으로 전달하도록 수정한다.

```java
public class LegacytHandlerMapping implements HandlerMapping {
  private Map<String, Controller> mappings = new HashMap<>();

  public void initMapping()
    UserDao userDao = new JdbcUserDao();
    UserService userService = new UserService(userDao);

    mappings.put("/user/signup", new SignUpController(userService));
    mappings.put("/user/login", new LoginController(userService));
    // ...
  }
}
```

이로써 싱글톤 패턴을 사용하지 않으면서 인스턴스 하나를 사용하도록 했다. 하지만 아쉬운점은,
컨트롤러 하나에서 시작해 꼬리를 꼬리를 물고 의존관계를 가지는 구조로 iniMapping() 에서 모두 구현해야한다. 만약 의존관계가 깊어진다면 initMapping() 객체간의 의존관계를 매핑해주는 작업이 매우 복잡해지기 떄문에 이 코드 또한 개선이 필요하다. 이 내용은 추후 별도로 다루겠다.

---

## step4. 어노테이션 기반 DI 컨테이너 구현

다음으로 HandlerMapping 의 또 다른 구현체인 어노테이션 기반 `AnnnotationHandlerMapping` 에 대해서도 DI 컨테이너로 개선했다.

기존의 어노테이션 기반 MVC 프레임워크는 자바 리플렉션을 활용해 @Controller 어노테이션이 설정되어 있는 클래스를 찾아 인스턴스를 생성하고, URL 매핑 작업을 자동화했다. 같은 방법으로 각 클래스에 대한 인스턴스 생성 및 의존관계 설정을 어노테이션을 자동화했다.

어노테이션은 각 클래스 역할에 맞도록 `@Service`, `@Repository` 어노테이션을 추가로 설정했다. 이 3개의 설정으로 생성된 각 인스턴스간의 의존관계는 `@Inject` 어노테이션을 사용한다. 이 `@Inject` 는 스프링부트에서 제공하는 ` @Autowired` 와 비슷한 역할을 수행한다. DI 컨테이너에 생성된 각 인스턴스는 스프링부트 프레임워크와 마찬가지로 `빈(Bean)` 오브젝트로 부르곘다.

### BeanFactory

빈(Bean) 인스턴스를 생성하는 클래스다. `instantiateClass()` 와 `instantiateConstructor()` 두 메소드의 재귀호출을 통해 복잡한 의존관계에 있는 빈을 생성하는 과정을 완료할 수 있다. `instantiateClass()` 을 보면 알 수 있듯이, Bean 인스턴스를 생성하기 위해 재귀 함수로 구현했다. `@Inject` 어노테이션이 설정되어 있는 생성자를 통해 Bean 객체를 생성한다. 그런데 이 생성자의 인자로 전달할 빈도 다른 빈과 의존관계에 있다. 이와 같이 꼬리에 꼬리를 물고 Bean 사이에서 의존관계가 발생할 수 있다. 다른 Bean 과 의존관계를 가지지 않는 Bean 을 찾아 인스턴스를 생성할 때 까지 재귀를 실행하는 방식으로 구현했다.

재귀함수의 시작은 `instantiateClass()` 에서 시작하게 되는 것이다. `@Inject` 어노테이션이 설정되어 있는 생성자가 존재하면 `instantiateConstructor()` 메소드를 통해 인스턴스를 생성하고, 존재하지 않을 경우 기본 생성자로 인스턴스를 생성한다. `instantiateConstructor()` 메소드는 생성자의 인자로 전달할 빈이 생성되어 `Map<Class<?>, Object>` 에 이미 존재하면 해당 빈을 활용하고, 존재하지 않을 경우 `instantiateClass()` 메소드를 통해 빈을 생성한다.

```java
public class BeanFactory {
    private static final Logger logger = LoggerFactory.getLogger(BeanFactory.class);

    private Set<Class<?>> preInstanticateBeans;

    private Map<Class<?>, Object> beans = Maps.newHashMap();

    public BeanFactory(Set<Class<?>> preInstanticateBeans) {
        this.preInstanticateBeans = preInstanticateBeans;
    }

    @SuppressWarnings("unchecked")
    public <T> T getBean(Class<T> requiredType) {
        return (T) beans.get(requiredType);
    }

    public void initialize() {
        for(Class<?> clazz : preInstanticateBeans) {
            if(beans.get(clazz) == null) {
                instantiateClass(clazz);
            }
        }
    }

    private Object instantiateClass(Class<?> clazz) {
        Object bean = beans.get(clazz);
        if(bean != null) {
            return bean;
        }

        Constructor<?> injectedConstructor = BeanFactoryUtils.getInjectedConstructor(clazz);
        if(injectedConstructor == null) {
            bean = BeanUtils.instantiate(clazz);
            beans.put(clazz, bean);
            return bean;
        }

        logger.debug("Constructor : {}", injectedConstructor);
        bean = instantiateConstructor(injectedConstructor);
        beans.put(clazz, bean);
        return bean;
    }

    private Object instantiateConstructor(Constructor<?> constructor) {
        Class<?>[] pTypes = constructor.getParameterTypes();
        List<Object> args = Lists.newArrayList();
        for(Class<?> clazz : pTypes) {
            Class<?> concreteClazz = BeanFactoryUtils.findConcreteClass(clazz, preInstanticateBeans);
            if(!preInstanticateBeans.contains(concreteClazz)) {
                throw new IllegalArgumentException(clazz + "는 Bean 이 아닙니다.");
            }

            Object bean = beans.get(concreteClazz);
            if(bean == null) {
                bean = instantiateClass(concreteClazz);
            }
            args.add(bean);
        }
        return BeanUtils.instantiateClass(constructor, args.toArray());
    }

    public Map<Class<?>, Object> getControllers() {
        Map<Class<?>, Object> controllers = Maps.newHashMap();
        for(Class<?> clazz : preInstanticateBeans) {
            Annotation annotation = clazz.getAnnotation(Configurable.class);
            if(annotation != null) {
                controllers.put(clazz, beans.get(clazz));
            }
        }
        return controllers;
    }
}

```

### BeanScanner

다음은 `@Controlller`, `@Service`, `@Repository` 로 설정되어 있는 빈을 찾는 `BeanScanner` 아래와 같이 구현했다. 또한 AnootationHandlerMapping 이 BeanFactory 를 사용할 수 있도록 개선했다. @Controller 로 설정한 빈을 조회할 수 있는 기능을 `getControllers()` 가 담당하게 했다.

```java
public class BeanScanner {
    private Reflections reflections;

    public BeanScanner(Object... basePackage) {
        reflections = new Reflections(basePackage);
    }

    @SuppressWarnings("unchecked")
    public Set<Class<?>> scan() {
        return getTypesAnnotatedWith(Controller.class, Service.class, Repository.class);
    }

    @SuppressWarnings("unchecked")
    private Set<Class<?>> getTypesAnnotatedWith(Class<? extends Annotation>... annotations) {
        Set<Class<?>> preInstantiatedBeans = Sets.newHashSet();
        for(Class<? extends Annotation> annotation : annotations) {
            preInstantiatedBeans.addAll(reflections.getTypesAnnotatedWith(annotation));
        }
        return preInstantiatedBeans;
    }
}
```

### AnnotationHandlerMapping

마지막으로 리팩토링된 AnnotationHandlerMapping 이다. BeanFactory 를 초기화한 후 @Controller 로 설정한 빈을 사용하도록 구현했다.

```java
public class AnnotationHandlerMapping implements HandlerMapping {
    private static final Logger logger = LoggerFactory.getLogger(AnnotationHandlerMapping.class);

    private Object[] basePackage;

    private Map<HandlerKey, HandlerExecution> handlerExecutions = Maps.newHashMap();

    public AnnotationHandlerMapping(Object... basePackage) {
        this.basePackage = basePackage;
    }

    public void initialize() {
        BeanScanner scanner = new BeanScanner(basePackage);
        BeanFactory beanFactory = new BeanFactory(scanner.scan());
        beanFactory.initialize();
        Map<Class<?>, Object> controllers = beanFactory.getControllers();
        Set<Method> methods = getRequestMappingMethods(controllers.keySet());
        for (Method method : methods) {
            RequestMapping rm = method.getAnnotation(RequestMapping.class);
            logger.debug("register handlerExecution : url is {}, method is {}", rm.value(), method);
            handlerExecutions.put(createHandlerKey(rm),
                    new HandlerExecution(controllers.get(method.getDeclaringClass()), method));
        }

        logger.info("Initialized AnnotationHandlerMapping!");
    }

    private HandlerKey createHandlerKey(RequestMapping rm) {
        return new HandlerKey(rm.value(), rm.method());
    }

    @SuppressWarnings("unchecked")
    private Set<Method> getRequestMappingMethods(Set<Class<?>> controlleers) {
        Set<Method> requestMappingMethods = Sets.newHashSet();
        for (Class<?> clazz : controlleers) {
            requestMappingMethods
                    .addAll(ReflectionUtils.getAllMethods(clazz, ReflectionUtils.withAnnotation(RequestMapping.class)));
        }
        return requestMappingMethods;
    }

    @Override
    public HandlerExecution getHandler(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        RequestMethod rm = RequestMethod.valueOf(request.getMethod().toUpperCase());
        logger.debug("requestUri : {}, requestMethod : {}", requestUri, rm);
        return handlerExecutions.get(new HandlerKey(requestUri, rm));
    }
}
```

### 어노테이션 적용

@Controller 에 이어서 @Service, @Repository 어노테이션을 적용한 예시 코드는 아래와 같다. 우리가 항상 스프링부트 프레임워크를 사용할 때 표시했던 어노테이션과 아주 유사한 구조를 지니며, 기능 역시 똑같이 동작한다 🙂

```java
@Service
public class TestService {
  private TestRepository testRepository;

  @Inject
  public TestService(TestRepository testRepository) {
    this.testRepository = testRepository;
  }
  // ...
}

@Repository
public class TestRepository {
  // ...
}
```

---

## 마치며

이렇게 이전에 구현했던 어노테이션 기반 MVC 프레임워크 구현 코드와 DI 컨테이너 코드를 통합했다. 지금까지 구현했던 실습 미션 중에 가장 어려웠던 내용이 아닌가 싶다 🥲 아직 100% 완벽히 내 것으로 만들었다는 기분은 아니기에, 그리고 매우 유익한 내용이기 떄문에 향후 다시 한번 제대로 정리해볼까 한다. 서블릿 컨테이너, JSP 내용부터 전반 내용을 상세히 정리해 봐야겠다.
