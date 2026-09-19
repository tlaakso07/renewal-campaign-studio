"""Build the standalone email attachment from reviewed copy and embedded previews.

Preview inputs are compressed derivatives of actual source/output files, staged in
.runtime/guide-assets. The output contains no app credentials or network scripts.
"""
from pathlib import Path
import base64, html, json, re
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'docs/review-guide-content.json').read_text())
template = (ROOT / 'docs/review-guide.template.html').read_text()
esc = html.escape

def image(name):
    path = ROOT / '.runtime/guide-assets' / name
    mime = 'image/png' if path.suffix == '.png' else 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

images = {key: image(name) for key, name in [('logo','logo.png'),('editorial','editorial.jpg'),('showcase','showcase.jpg'),('split','split.jpg'),('video','video.jpg')]}
filters = ''.join(f'<button class="filter" type="button" data-group="{g}" aria-pressed="{str(g=="All").lower()}">{g}</button>' for g in ['All','Create','Library','Measure','Learn','Workspace'])
buttons, articles = [], []
for f in data['features']:
    fid = f['id']
    buttons.append(f'<button type="button" data-select-feature="{fid}" aria-controls="feature-{fid}" aria-pressed="false"><span>{esc(f["name"])}<small>{esc(f["group"])} · {esc(f["status"])}</small></span><span class="arrow" aria-hidden="true">↗</span></button>')
    status_class = 'ready' if f['status']=='Try now' else 'off' if f['status'] in ['Not connected','Owner / staff','View in review'] else 'limited'
    link = '' if f['route'] is None else f'<a class="feature-link" href="https://renewal-campaign-studio-tlaakso11-3399s-projects.vercel.app/#/{f["route"]}" target="_blank" rel="noopener noreferrer">Open in app after signing in ↗</a>'
    does = ''.join(f'<li>{esc(t)}</li>' for t in f['does'])
    steps = ''.join(f'<li>{esc(t)}</li>' for t in f['steps'])
    articles.append(f'''<article class="feature-article" id="feature-{fid}" aria-labelledby="title-{fid}"><div class="feature-head"><p class="eyebrow">{esc(f['group'])} / {esc(f['kicker'])}</p><span class="status {status_class}">{esc(f['status'])}</span></div><h3 id="title-{fid}" tabindex="-1">{esc(f['name'])}</h3><p class="feature-summary">{esc(f['summary'])}</p><div class="feature-columns"><div><h4>What it does</h4><ul>{does}</ul></div><div><h4>How to use it</h4><ol>{steps}</ol></div></div><div class="feature-bottom"><h4>What you get</h4><p>{esc(f['result'])}</p></div><div class="feature-limit"><strong>Current scope & limits</strong>{esc(f['limit'])}</div>{link}</article>''')
workflow_buttons = ''.join(f'<button type="button" data-workflow="{w["id"]}" aria-pressed="{str(i==0).lower()}">{esc(w["name"])}</button>' for i,w in enumerate(data['workflows']))
workflow_print = ''.join('<article class="print-flow"><h3>'+esc(w['name'])+'</h3><ol>'+''.join('<li><strong>'+esc(s[0])+'.</strong> '+esc(s[1])+'</li>' for s in w['steps'])+'</ol><p><strong>Result:</strong> '+esc(w['outcome'])+'</p></article>' for w in data['workflows'])
samples=[]
for key,title,subtitle,alt,caption in [
    ('editorial','Editorial static','Portrait PNG · saved version 2','Actual editorial static ad from the Renewal prototype','Actual saved editorial PNG, compressed for this guide. This awareness exercise is not a verified advertising winner.'),
    ('showcase','Product showcase','Portrait PNG · saved version 2','Actual product showcase static ad from the Renewal prototype','Actual saved product-showcase PNG, using supplied photography and logo artwork. No current promotional offer is included.'),
    ('split','Split composition','Portrait PNG · saved version 2','Actual split composition static ad from the Renewal prototype','Actual saved split-layout PNG. Download full-resolution files from the app; this embedded preview is for reviewing the guide.'),
    ('video','Real-footage walkthrough','Still from the 15-second MP4','Frame from the actual 15-second source-footage video export','A still frame from the actual 15-second exported MP4. This is source-footage assembly, not a generated presenter or customer testimonial. Watch the full video in the app.')]:
    samples.append(f'<figure class="sample"><button type="button" data-sample="{key}" data-title="{esc(title,quote=True)}" data-caption="{esc(caption,quote=True)}" aria-label="Enlarge {esc(title,quote=True)}"><img id="sample-{key}" src="{images[key]}" alt="{esc(alt,quote=True)}" loading="lazy"></button><figcaption><strong>{esc(title)}</strong><span>{esc(subtitle)}</span></figcaption></figure>')
checklist = ['Read the current campaign brief and terms','Change one headline and check the saved preview','Inspect a video’s scenes, captions and timing','Download a finished ad or campaign ZIP','Explore the brand, assets and a Classroom guide','Identify the next feature or connection that matters most']
checks = ''.join(f'<label class="check-row"><input type="checkbox" data-check="{esc(t,quote=True)}"><span>{esc(t)}</span></label>' for t in checklist)
replacements={'LOGO':images['logo'],'SHOWCASE':images['showcase'],'FILTERS':filters,'FEATURE_BUTTONS':''.join(buttons),'FEATURE_ARTICLES':''.join(articles),'WORKFLOW_BUTTONS':workflow_buttons,'WORKFLOW_PRINT':workflow_print,'SAMPLES':''.join(samples),'CHECKLIST':checks,'DATA':json.dumps(data,ensure_ascii=False).replace('<','\\u003c')}
for key,value in replacements.items():template=template.replace('@@'+key+'@@',value)
assert not re.search(r'@@[A-Z_]+@@',template), 'Unexpanded template variable'
assert '_vercel_share' not in template and 'REVIEW_PASSWORD' not in template
output=ROOT/'deliverables/Renewal-Studio-Interactive-Guide.html'
output.parent.mkdir(exist_ok=True)
output.write_text(template)
print(f'Created {output}: {output.stat().st_size:,} bytes; {len(data["features"])} feature areas; {len(data["workflows"])} workflows.')
