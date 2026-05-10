from setuptools import setup, find_packages

setup(
    name='min-conflit',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
    ],
    entry_points={
        'console_scripts': [
            'min-conflit=app:app.run',   # optional: run as "min-conflit" command
        ],
    },
    package_data={
        'static': ['*', '**/*'],
    },
)