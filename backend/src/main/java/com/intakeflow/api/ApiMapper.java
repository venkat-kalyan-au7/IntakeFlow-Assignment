package com.intakeflow.api;

import com.intakeflow.domain.*;
import static com.intakeflow.api.ApiModels.*;
import java.util.*;

public final class ApiMapper {
 private ApiMapper(){}
 public static UserView user(AppUser u){return new UserView(u.getId(),u.getEmail(),u.getDisplayName(),u.getRole());}
 public static FormView form(FormVersion v){return new FormView(v.getForm().getId(),v.getId(),v.getVersionNumber(),v.getForm().getSlug(),v.getTitle(),v.getDescription(),v.getStatus(),v.getPublishedAt(),v.getFields().stream().map(ApiMapper::field).toList());}
 public static FieldView field(FormField f){return new FieldView(f.getId(),f.getFieldKey(),f.getLabel(),f.getDescription(),f.getFieldType(),f.isRequired(),f.getPositionIndex(),f.getOptions().stream().map(FieldOption::getValue).toList());}
 public static SubmissionView submission(Submission s){
   var answers=s.getAnswers().stream().sorted(Comparator.comparingInt(a->a.getField().getPositionIndex())).map(a->new AnswerView(a.getField().getFieldKey(),a.getField().getLabel(),a.getField().getFieldType(),a.getValue())).toList();
   var events=s.getEvents().stream().map(e->new EventView(e.getId(),e.getAction(),e.getFromStatus(),e.getToStatus(),e.getComment(),e.getActor().getDisplayName(),e.getCreatedAt())).toList();
   return new SubmissionView(s.getId(),s.getReferenceCode(),s.getFormVersion().getForm().getId(),s.getFormVersion().getId(),s.getFormVersion().getTitle(),s.getFormVersion().getVersionNumber(),s.getRequester().getDisplayName(),s.getRequester().getEmail(),s.getStatus(),s.getRejectionComment(),s.getCreatedAt(),s.getUpdatedAt(),s.getSubmittedAt(),s.getReviewedAt(),answers,events);
 }
}
