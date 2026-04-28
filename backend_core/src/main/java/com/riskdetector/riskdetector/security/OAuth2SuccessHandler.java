package com.riskdetector.riskdetector.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    private final JwtUtil jwtUtil;

    @Value("${app.oauth2.redirect-uri}")
    private String frontendRedirectUri;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        String token = jwtUtil.generateToken(email);

        // 크로스 오리진 환경을 위해 SameSite=None; Secure 쿠키 설정
        // (백엔드와 프론트엔드가 다른 도메인일 경우 None이어야 쿠키가 전달됨)
        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax") // 배포 환경(HTTPS)에서는 None
                .path("/")
                .maxAge(Duration.ofMillis(jwtUtil.getExpirationMs()))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        logger.info("OAuth2 login successful for user: {}", email);

        // 토큰을 URL 파라미터로도 전달 (크로스 오리진 쿠키 미전달 환경 대비)
        String redirectUri = frontendRedirectUri + "?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUri);
    }
}
