// frontnend/src/utils/firebaseErrors.js
// firebase 에러 메시지 유틸리티 함수
export function getFirebaseErrorMessage(error) {
  const code = error.code;

  switch (code) {
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일입니다.";
    case "auth/invalid-email":
      return "유효하지 않은 이메일 형식입니다.";
    case "auth/weak-password":
      return "비밀번호는 최소 6자 이상이어야 합니다.";
    case "auth/user-not-found":
      return "가입된 이메일이 없습니다.";
    case "auth/wrong-password":
      return "비밀번호가 틀렸습니다.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다.";
    case "permission-denied":
      return "접근 권한이 없습니다.";
    default:
      return "알 수 없는 오류가 발생했습니다.";
  }
}
