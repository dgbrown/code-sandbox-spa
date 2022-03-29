async function onsubmit(e) {
    e.preventDefault()
    let codez = e.target.codez.value
    console.log(codez)

    let response = await fetch('/exec', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            codez,
        }),
    })

    let json = await response.json()
    console.log('json response', json)
    let resultEl = document.getElementById('result')
    resultEl.innerHTML = json.result
}

document.addEventListener('DOMContentLoaded', () => {
    document.code.addEventListener('submit', onsubmit)
})
