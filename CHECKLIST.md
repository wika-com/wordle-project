# Checklist Projektu Kubernetes — Aplikacja Wieloserwisowa z CI/CD

*Autor:* Wiktoria Woronecka  
*Nazwa Projektu:* Wordle Game
*Środowisko uruchomieniowe:* Lokalny klaster `minikube` / `kind`

## 1. Instrukcja uruchomienia projektu
Upewnij się, że masz uruchomiony lokalny klaster (np. `minikube start` lub `kind create cluster`).

## Komendy instalacyjne (Kolejność strukturalna):

# 1. Przestrzeń nazw i konfiguracja bezpieczeństwa
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# 2. Infrastruktura danych, cache oraz polityki sieciowe
kubectl apply -f k8s/db-statefulset.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/network-policy.yaml
kubectl apply -f k8s/pdb.yaml

# 3. Usługi sieciowe, aplikacja i Ingress
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Lista zasobów Kubernetes
Namespace - k8s/namespace.yaml
Deploymenty (rollingUpdate) - backend-deployment.yaml, frontend-deployment.yaml
Baza danych i trwałość (PVC) - db-statefulset.yaml (StatefulSet + volumeClaimTemplates)
Services, Ingress i izolacja - services.yaml, ingress.yaml
ConfigMap i Secret - configmap.yaml, secrets.yaml
Sondy i zasoby (Probes) - Wszystkie kontenery mają ustawione limits/requests oraz sondy Liveness/Readiness
SecurityContext & InitContainer - Kontenery działają jako non-root. Backend ma InitContainer wait-for-db
CI/CD GitHub Actions - .github/workflows/deploy.yml
Trwałość danych - Dane przetrzymywane w PostgreSQL nie znikają po wykonaniu kubectl delete pod
Cache - Wdrożony i w pełni spięty z backendem kontener redis:7-alpine

# Komendy
```bash
kubectl get pods -n wordle-game - status podów
NAME                               READY   STATUS    RESTARTS   AGE
wordle-backend-65ccc45786-qpmsj    1/1     Running   0          43h
wordle-backend-65ccc45786-svgxk    1/1     Running   0          42h
wordle-cache-78b9ffcb89-xkxm4      1/1     Running   0          43h
wordle-db-0                        1/1     Running   0          3d19h
wordle-frontend-567cc56d99-k79nn   1/1     Running   0          43h

kubectl rollout status deployment/wordle-backend -n wordle-game - sprawdzenie statusu rolloutu backendu
deployment "wordle-backend" successfully rolled out

kubectl get all -n wordle-game - pokazuje wszystko

kubectl get statefulset wordle-db -n wordle-game -o yaml - wyświetlenie szczegółów danego obiektu

# wyświetlenie opisu poda
kubectl get pods -n wordle-game
kubectl describe pod <nazwa_poda_backendu> -n wordle-game
Name:             wordle-backend-65ccc45786-qpmsj
Namespace:        wordle-game
Priority:         0
Service Account:  default
Node:             desktop-control-plane/172.18.0.2
Start Time:       Sat, 30 May 2026 22:03:55 +0200
Labels:           app=wordle-backend
                  pod-template-hash=65ccc45786
Annotations:      <none>
Status:           Running
IP:               10.244.0.11
IPs:
  IP:           10.244.0.11

kubectl logs deployment/wordle-backend -c backend -n wordle-game --tail=50 - Wyświetlenie logów poda
Found 2 pods, using pod/wordle-backend-65ccc45786-qpmsj
Serwer działa na porcie 3000
Połączono z PostgreSQL i zainicjalizowano tabelę.
Połączono z MQTT
Pokój [Pokój 2] otrzymał słowo: BLOND
Pokój [Eksperci] otrzymał słowo: TIROS
Pokój [Pokój 1] otrzymał słowo: BRILL
Pokój [Globalny] otrzymał słowo: SPRAT
Połączono z MQTT
```

# instrukcja działania redis
  # Sprawdź czy status podu jest running
  kubectl get pods -l app=wordle-cache -n wordle-game

  # Wpisz i sprawdź czy odpowie
  kubectl exec -it deployment/wordle-cache -n wordle-game -- redis-cli ping
  *powinno być* pong
  
*Link do workflow:* https://github.com/wika-com/wordle-project/actions/runs/26762955119/job/78881332116