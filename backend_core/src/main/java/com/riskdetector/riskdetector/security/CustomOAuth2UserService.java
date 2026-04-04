package com.riskdetector.riskdetector.security;

import com.riskdetector.riskdetector.entity.User;
import com.riskdetector.riskdetector.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String provider = userRequest.getClientRegistration().getRegistrationId();

        if (!StringUtils.hasText(email) || !email.contains("@")) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_email"),
                    "Invalid or missing email from OAuth2 provider");
        }

        if (!StringUtils.hasText(name)) {
            name = email.split("@")[0];
        }

        final String resolvedName = name;
        final String resolvedPicture = picture;

        userRepository.findByEmail(email)
                .map(user -> userRepository.save(user.update(resolvedName, resolvedPicture)))
                .orElseGet(() -> {
                    logger.info("New OAuth2 user registered via provider: {}", provider);
                    return userRepository.save(
                            User.builder()
                                    .email(email)
                                    .name(resolvedName)
                                    .picture(resolvedPicture)
                                    .provider(provider)
                                    .build()
                    );
                });

        return oAuth2User;
    }
}
