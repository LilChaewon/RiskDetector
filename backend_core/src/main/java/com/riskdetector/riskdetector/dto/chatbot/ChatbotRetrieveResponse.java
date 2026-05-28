package com.riskdetector.riskdetector.dto.chatbot;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatbotRetrieveResponse {
    private boolean success;
    private String error;
    private String query;
    private String knowledgeBaseId;
    private String contractType;
    private List<RetrievedItem> results;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RetrievedItem {
        private Integer rank;
        private Double score;
        private String text;
        private String sourceLabel;
        private String basisPhrase;
        private String location;
    }
}
