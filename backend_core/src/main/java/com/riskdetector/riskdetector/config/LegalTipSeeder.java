package com.riskdetector.riskdetector.config;

import com.riskdetector.riskdetector.entity.LegalTip;
import com.riskdetector.riskdetector.repository.LegalTipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class LegalTipSeeder implements ApplicationRunner {

    private final LegalTipRepository legalTipRepository;
    private final ResourcePatternResolver resourcePatternResolver;

    @Value("${app.legal-tips.seed-enabled:true}")
    private boolean seedEnabled;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (!seedEnabled) return;

        Resource[] resources = resourcePatternResolver.getResources("classpath*:/legal-tips/easylaw-summary/*.txt");
        int inserted = 0;
        int updated = 0;
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (!StringUtils.hasText(filename)) {
                continue;
            }
            String raw = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            ParsedTip tip = parse(raw);
            if (!tip.valid()) {
                log.debug("Skipping invalid legal tip seed: {}", filename);
                continue;
            }
            var existing = legalTipRepository.findBySourceId(filename);
            if (existing.isPresent()) {
                existing.get().updateFromSummaryDocument(tip.category(), tip.question(), tip.summary(), tip.sourceUrl());
                updated++;
                continue;
            }
            legalTipRepository.save(LegalTip.builder()
                    .sourceId(filename)
                    .category(tip.category())
                    .question(tip.question())
                    .summary(tip.summary())
                    .answer(tip.summary())
                    .sourceUrl(tip.sourceUrl())
                    .viewCount(0L)
                    .build());
            inserted++;
        }
        if (inserted > 0) {
            log.info("Seeded {} EasyLaw legal tips", inserted);
        }
        if (updated > 0) {
            log.info("Updated summaries for {} EasyLaw legal tips", updated);
        }
    }

    private ParsedTip parse(String raw) {
        String question = between(raw, "질문:", "\n\n요약:");
        String summary = between(raw, "요약:", "\n\n카테고리:");
        String category = between(raw, "카테고리:", "\n\n원문URL:");
        String sourceUrl = after(raw, "원문URL:");
        return new ParsedTip(clean(question), clean(summary), clean(category), clean(sourceUrl));
    }

    private String between(String raw, String start, String end) {
        int from = raw.indexOf(start);
        if (from < 0) return "";
        from += start.length();
        int to = raw.indexOf(end, from);
        if (to < 0) return "";
        return raw.substring(from, to);
    }

    private String after(String raw, String start) {
        int from = raw.indexOf(start);
        if (from < 0) return "";
        return raw.substring(from + start.length());
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private record ParsedTip(String question, String summary, String category, String sourceUrl) {
        boolean valid() {
            return StringUtils.hasText(question)
                    && StringUtils.hasText(summary)
                    && StringUtils.hasText(category);
        }
    }
}
