package com.intakeflow.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="form_versions", uniqueConstraints=@UniqueConstraint(columnNames={"form_id","version_number"}))
public class FormVersion {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="form_id") private FormDefinition form;
    @Column(name="version_number", nullable=false) private int versionNumber;
    @Column(nullable=false, length=160) private String title;
    @Column(length=600) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=24) private FormVersionStatus status=FormVersionStatus.DRAFT;
    @Column(name="published_at") private Instant publishedAt;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt=Instant.now();
    @OneToMany(mappedBy="formVersion", cascade=CascadeType.ALL, orphanRemoval=true)
    @OrderBy("positionIndex ASC") private List<FormField> fields=new ArrayList<>();
    public void addField(FormField field){field.setFormVersion(this); fields.add(field);}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public FormDefinition getForm(){return form;} public void setForm(FormDefinition v){form=v;}
    public int getVersionNumber(){return versionNumber;} public void setVersionNumber(int v){versionNumber=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public FormVersionStatus getStatus(){return status;} public void setStatus(FormVersionStatus v){status=v;}
    public Instant getPublishedAt(){return publishedAt;} public void setPublishedAt(Instant v){publishedAt=v;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant v){createdAt=v;}
    public List<FormField> getFields(){return fields;} public void setFields(List<FormField> v){fields=v;}
}
