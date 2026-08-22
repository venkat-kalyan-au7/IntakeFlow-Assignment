package com.intakeflow.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.intakeflow.domain.FieldOption;
import com.intakeflow.domain.FieldType;
import com.intakeflow.domain.FormField;
import com.intakeflow.domain.FormVersion;
import com.intakeflow.domain.Submission;
import com.intakeflow.domain.SubmissionAnswer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SubmissionServiceTest {

  private SubmissionService service;
  private Submission submission;

  @BeforeEach
  void setUp() {
    service = new SubmissionService(null, null, null);
    submission = new Submission();
    submission.setFormVersion(new FormVersion());
  }

  @Test
  void requiresAnswersBeforeSubmission() {
    addField(1L, "companyName", "Company name", FieldType.TEXT, true);

    assertThatThrownBy(() -> service.validate(submission, true))
        .hasMessage("Company name is required");
  }

  @Test
  void validatesTypedAnswers() {
    FormField amount = addField(1L, "amount", "Contract value", FieldType.NUMBER, true);
    answer(amount, "not-a-number");

    assertThatThrownBy(() -> service.validate(submission, true))
        .hasMessage("Contract value must be a number");
  }

  @Test
  void acceptsValidDropdownOption() {
    FormField region = addField(1L, "region", "Region", FieldType.DROPDOWN, true);
    FieldOption option = new FieldOption();
    option.setValue("APAC");
    region.addOption(option);
    answer(region, "APAC");

    assertThatCode(() -> service.validate(submission, true)).doesNotThrowAnyException();
  }

  @Test
  void rejectsUnknownDropdownOption() {
    FormField region = addField(1L, "region", "Region", FieldType.DROPDOWN, true);
    FieldOption option = new FieldOption();
    option.setValue("APAC");
    region.addOption(option);
    answer(region, "EMEA");

    assertThatThrownBy(() -> service.validate(submission, true))
        .hasMessage("Choose a valid option for Region");
  }

  private FormField addField(Long id, String key, String label, FieldType type, boolean required) {
    FormField field = new FormField();
    field.setId(id);
    field.setFieldKey(key);
    field.setLabel(label);
    field.setFieldType(type);
    field.setRequired(required);
    field.setFormVersion(submission.getFormVersion());
    submission.getFormVersion().getFields().add(field);
    return field;
  }

  private void answer(FormField field, String value) {
    SubmissionAnswer answer = new SubmissionAnswer();
    answer.setField(field);
    answer.setValue(value);
    submission.addAnswer(answer);
  }
}
