{{/*
Expand the name of the chart.
*/}}
{{- define "shop-learn.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "shop-learn.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "shop-learn.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "shop-learn.labels" -}}
helm.sh/chart: {{ include "shop-learn.chart" . }}
{{ include "shop-learn.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "shop-learn.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shop-learn.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Checksum of the SealedSecret's encrypted payload. Changes only when the
secret is re-sealed, so consumers restart exactly then - and never on a
spurious render. "initial-install" before the first sync (lookup miss).
*/}}
{{- define "shop-learn.pgSecretChecksum" -}}
{{- $ss := lookup "sealedsecrets.bitnami.com/v1alpha1" "SealedSecret" .Release.Namespace (printf "%s-postgres" (include "shop-learn.fullname" .)) -}}
{{- if $ss -}}
{{- toJson $ss.spec.encryptedData | sha256sum -}}
{{- else -}}
{{- "initial-install" -}}
{{- end -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "shop-learn.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "shop-learn.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
